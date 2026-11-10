const pool = require("../db/pool");
const AppError = require("../utils/AppError");

// ---------------------------------------------------------------------------
// Contratos de alquiler fijo (tabla `contrato`). Solo lecturas; el alcance
// (`contratoScope`) lo resuelve el middleware:
//   - cliente  → contrato.usuario_id = <id del usuario>
//   - corredor → inmuebles.corredor_id = <id del corredor>
// ---------------------------------------------------------------------------

// Cláusula WHERE según el rol. Agrega el valor al array y devuelve la cláusula.
function scopeWhere(scope, values) {
  values.push(Number(scope.id));
  if (scope.tipo === "cliente") return `ct.usuario_id = $${values.length}`;
  return `i.corredor_id = $${values.length}`;
}

// Mensualidades de un contrato con sus transacciones (vía transaccion_mensualidades).
const MENSUALIDADES_EXPR = `
  COALESCE((
    SELECT json_agg(m2 ORDER BY m2.numero_cuota)
    FROM (
      SELECT
        m.id,
        m.uuid,
        m.numero_cuota,
        m.periodo_mes,
        m.periodo_anio,
        m.monto_meta,
        m.monto_pagado,
        m.estado,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', t.id,
            'numero_factura', t.numero_factura,
            'monto_total', t.monto_total,
            'moneda', t.moneda,
            'estatus_pago', t.estatus_pago,
            'fecha_transaccion', t.fecha_transaccion,
            -- Porcentaje del corredor sobre este pago. La comision no se envia: la
            -- calcula el cliente (src/utils/comision.js) a partir de este porcentaje,
            -- para no duplicar la fuente de verdad del trigger.
            'porcentaje_aplicado', c.porcentaje_aplicado
          ) ORDER BY t.fecha_transaccion)
          FROM transaccion_mensualidades tm
          JOIN transacciones t ON t.id = tm.transaccion_id
          LEFT JOIN comisiones c ON c.transaccion_id = t.id
          WHERE tm.mensualidad_id = m.id
        ), '[]'::json) AS transacciones
      FROM mensualidades m
      WHERE m.contrato_id = ct.id
    ) m2
  ), '[]'::json) AS mensualidades
`;

const CONTRATO_SELECT = `
  SELECT
    ct.id AS contrato_id,
    ct.uuid AS contrato_uuid,
    ct.precio_mensualidad,
    ct.moneda,
    ct.cantidad_meses,
    ct.fecha_inicio,
    ct.active,

    af.id AS alquiler_fijo_id,

    i.id AS inmueble_id,
    i.uuid AS inmueble_uuid,
    i.titulo AS inmueble_titulo,
    i.precio AS inmueble_precio,
    CASE i.estado_inmueble
      WHEN 'alquiler_fijo' THEN 'Alquiler fijo'
      WHEN 'venta' THEN 'Venta'
      WHEN 'vacacional' THEN 'Vacacional'
      ELSE INITCAP(REPLACE(i.estado_inmueble, '_', ' '))
    END AS inmueble_estado,
    (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS inmueble_imagen_url,
    ci.nombre AS inmueble_ciudad,
    es.nombre AS inmueble_region,

    cl.id AS cliente_id,
    cl.uuid AS cliente_uuid,
    cl.nombre AS cliente_nombre,
    cl.email AS cliente_email,
    cl.foto_url AS cliente_foto_url,

    co.id AS corredor_id,
    cu.id AS corredor_usuario_id,
    cu.uuid AS corredor_usuario_uuid,
    cu.nombre AS corredor_nombre,
    cu.email AS corredor_email,
    cu.foto_url AS corredor_foto_url,

    (SELECT COALESCE(SUM(m.monto_pagado), 0)::numeric
       FROM mensualidades m WHERE m.contrato_id = ct.id) AS total_pagado,
    (SELECT COUNT(*)::int
       FROM mensualidades m
      WHERE m.contrato_id = ct.id AND m.estado = 'pagado') AS cuotas_pagadas,
    ${MENSUALIDADES_EXPR}
`;

const CONTRATO_FROM = `
  FROM contrato ct
  JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
  JOIN inmuebles i ON i.id = af.inmueble_id
  JOIN usuarios cl ON cl.id = ct.usuario_id
  LEFT JOIN ciudades ci ON ci.id = i.ciudad_id
  LEFT JOIN estados es ON es.id = ci.estado_id
  JOIN corredores co ON co.id = i.corredor_id
  JOIN usuarios cu ON cu.id = co.usuario_id
`;

// Paginación común a los listados: `?limit=` (1..200, default 100), `?offset=`
// o `?page=`. Un `offset` explícito gana sobre `page` ((page-1)*limit).
function parsePagination({ limit, offset, page } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 100, 1), 200);
  let off = Math.max(Number(offset) || 0, 0);
  if (!offset && page) {
    off = (Math.max(Number(page) || 1, 1) - 1) * lim;
  }
  return { lim, off };
}

// Bloque `pagination` de la respuesta (aditivo: no rompe lo que ya consumía
// page/limit/offset/total).
function buildPagination(lim, off, total) {
  return {
    page: Math.floor(off / lim) + 1,
    limit: lim,
    offset: off,
    total,
    totalPages: Math.max(Math.ceil(total / lim), 1),
    hasMore: off + lim < total,
  };
}

// Lista los contratos del cliente o del corredor según `scope`, con filtros.
exports.listContratos = async (scope, filters = {}) => {
  const { active, desde, hasta } = filters;
  const { lim, off } = parsePagination(filters);

  const values = [];
  const whereClauses = [scopeWhere(scope, values)];

  if (active === "true" || active === "false") {
    values.push(active === "true");
    whereClauses.push(`ct.active = $${values.length}`);
  }
  if (desde) {
    values.push(desde);
    whereClauses.push(`ct.fecha_inicio >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    whereClauses.push(`ct.fecha_inicio < ($${values.length}::date + interval '1 day')`);
  }

  const where = `WHERE ${whereClauses.join(" AND ")}`;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total
        FROM contrato ct
        JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
        JOIN inmuebles i ON i.id = af.inmueble_id
        ${where}`,
    values
  );
  const total = Number(countRows[0]?.total || 0);

  values.push(lim);
  const limIdx = values.length;
  values.push(off);
  const offIdx = values.length;

  const { rows } = await pool.query(
    `${CONTRATO_SELECT}
     ${CONTRATO_FROM}
     ${where}
     ORDER BY ct.fecha_inicio DESC, ct.id DESC
     LIMIT $${limIdx}
     OFFSET $${offIdx}`,
    values
  );

  return {
    data: rows,
    pagination: buildPagination(lim, off, total),
  };
};

// Un contrato en particular; 404 si no existe o no pertenece al alcance del usuario.
exports.getContratoById = async (scope, id) => {
  if (!/^\d+$/.test(String(id))) {
    throw new AppError("Contrato no encontrado", 404);
  }

  const values = [];
  const whereClauses = [scopeWhere(scope, values)];
  values.push(Number(id));
  whereClauses.push(`ct.id = $${values.length}`);

  const { rows } = await pool.query(
    `${CONTRATO_SELECT}
     ${CONTRATO_FROM}
     WHERE ${whereClauses.join(" AND ")}
     LIMIT 1`,
    values
  );

  if (!rows.length) throw new AppError("Contrato no encontrado", 404);

  return rows[0];
};

// Id de la URL: debe ser numérico.
function parseId(id) {
  if (!/^\d+$/.test(String(id))) throw new AppError("Id inválido", 400);
  return Number(id);
}

// Contratos ACTIVOS del cliente indicado (por defecto solo activos; puede
// ampliarse con ?active=false o ?active=all desde la query).
exports.listContratosDeCliente = (clienteId, filters = {}) =>
  exports.listContratos({ tipo: "cliente", id: parseId(clienteId) }, { active: "true", ...filters });

// Contratos que existen sobre los inmuebles del corredor indicado.
// `:id` es el id de USUARIO (igual que /corredores/:usuario_id); el corredores.id
// se resuelve internamente.
exports.listContratosDeCorredor = async (usuarioId, filters = {}) => {
  const uid = parseId(usuarioId);

  const { rows } = await pool.query(
    "SELECT id FROM corredores WHERE usuario_id = $1 LIMIT 1",
    [uid]
  );

  if (!rows.length) {
    const { lim } = parsePagination(filters);
    return { data: [], pagination: buildPagination(lim, 0, 0) };
  }

  return exports.listContratos({ tipo: "corredor", id: rows[0].id }, filters);
};

// ---------------------------------------------------------------------------
// Mensualidades (cuotas de alquiler fijo), con filtros y paginación.
// ---------------------------------------------------------------------------

const ESTADOS_MENSUALIDAD = ["pendiente", "pagado", "pagado_parcial"];

const MENSUALIDAD_SELECT = `
  SELECT
    m.id,
    m.uuid,
    m.numero_cuota,
    m.periodo_mes,
    m.periodo_anio,
    m.monto_meta,
    m.monto_pagado,
    (m.monto_meta - m.monto_pagado) AS monto_pendiente,
    m.estado,

    ct.id AS contrato_id,
    ct.uuid AS contrato_uuid,
    ct.precio_mensualidad,
    ct.moneda,
    ct.cantidad_meses,
    ct.fecha_inicio,
    ct.active AS contrato_active,

    i.id AS inmueble_id,
    i.uuid AS inmueble_uuid,
    i.titulo AS inmueble_titulo,

    cl.id AS cliente_id,
    cl.uuid AS cliente_uuid,
    cl.nombre AS cliente_nombre,
    cl.email AS cliente_email,
    cl.foto_url AS cliente_foto_url,

    co.id AS corredor_id,
    cu.id AS corredor_usuario_id,
    cu.uuid AS corredor_usuario_uuid,
    cu.nombre AS corredor_nombre,
    cu.email AS corredor_email,
    cu.foto_url AS corredor_foto_url,

    COALESCE((
      SELECT json_agg(json_build_object(
        'id', t.id,
        'numero_factura', t.numero_factura,
        'monto_total', t.monto_total,
        'moneda', t.moneda,
        'estatus_pago', t.estatus_pago,
        'fecha_transaccion', t.fecha_transaccion,
        -- Ver MENSUALIDADES_EXPR: solo el porcentaje; la comision la calcula el cliente.
        'porcentaje_aplicado', c.porcentaje_aplicado
      ) ORDER BY t.fecha_transaccion)
      FROM transaccion_mensualidades tm
      JOIN transacciones t ON t.id = tm.transaccion_id
      LEFT JOIN comisiones c ON c.transaccion_id = t.id
      WHERE tm.mensualidad_id = m.id
    ), '[]'::json) AS transacciones
  FROM mensualidades m
  JOIN contrato ct ON ct.id = m.contrato_id
  JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
  JOIN inmuebles i ON i.id = af.inmueble_id
  JOIN usuarios cl ON cl.id = ct.usuario_id
  JOIN corredores co ON co.id = i.corredor_id
  JOIN usuarios cu ON cu.id = co.usuario_id
`;

// Alcance sobre un inmueble (alias `i`): el cliente solo ve los inmuebles donde
// tiene contrato; el corredor, los suyos. No exige que existan contratos todavía.
function inmuebleScopeWhere(scope, values) {
  values.push(Number(scope.id));
  const idx = `$${values.length}`;
  if (scope.tipo === "cliente") {
    return `EXISTS (
      SELECT 1
        FROM contrato ct
        JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
       WHERE af.inmueble_id = i.id AND ct.usuario_id = ${idx}
    )`;
  }
  return `i.corredor_id = ${idx}`;
}

// Etiqueta del mes en español, independiente del locale de PostgreSQL: permite
// búsquedas tipo "Enero 2026" en el filtro `?q=`.
const MES_LABEL_SQL = `(CASE m.periodo_mes
  WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
  WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
  WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
  WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
  ELSE '' END)`;

// Filtros comunes sobre las cláusulas de `mensualidades`:
//   ?estado=  uno o varios separados por coma (pendiente|pagado|pagado_parcial)
//   ?contrato_id=
//   ?periodo_desde= / ?periodo_hasta=  rango por periodo, en formato AAAA-MM (o AAAA)
//   ?q=       texto libre: mes ("Enero 2026"), año, importe, estado o N° cuota.
//
// El rango se compara sobre (periodo_anio, periodo_mes), no sobre texto: asi "2026-03"
// ordena correctamente y el limite es inclusivo en ambos extremos. Cada extremo se puede
// dar solo como año ("2026"), que se normaliza a enero o diciembre segun corresponda.
function parsePeriodo(valor, { esHasta }) {
  const s = String(valor || "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) {
    const anio = Number(m[1]);
    const mes = Number(m[2]);
    if (!anio || mes < 1 || mes > 12) {
      throw new AppError(`Periodo inválido: ${s}. Use el formato AAAA-MM`, 400);
    }
    return { anio, mes };
  }

  m = s.match(/^(\d{4})$/);
  if (m) {
    const anio = Number(m[1]);
    if (!anio) throw new AppError(`Periodo inválido: ${s}. Use el formato AAAA-MM`, 400);
    // Extremo suelto por año: cubre el año entero.
    return { anio, mes: esHasta ? 12 : 1 };
  }

  throw new AppError(`Periodo inválido: ${s}. Use el formato AAAA-MM`, 400);
}

function applyMensualidadFilters(filters, whereClauses, values) {
  const { estado, contrato_id: contratoFiltro, periodo_desde, periodo_hasta, q } = filters;

  if (estado) {
    const estados = String(estado)
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const invalidos = estados.filter((e) => !ESTADOS_MENSUALIDAD.includes(e));
    if (!estados.length || invalidos.length) {
      throw new AppError("Estado inválido: use pendiente, pagado o pagado_parcial", 400);
    }
    values.push(estados);
    whereClauses.push(`m.estado = ANY($${values.length}::text[])`);
  }
  if (contratoFiltro) {
    values.push(parseId(contratoFiltro));
    whereClauses.push(`m.contrato_id = $${values.length}`);
  }

  const desde = parsePeriodo(periodo_desde, { esHasta: false });
  const hasta = parsePeriodo(periodo_hasta, { esHasta: true });
  if (desde && hasta) {
    const aDesde = desde.anio * 12 + desde.mes - 1;
    const aHasta = hasta.anio * 12 + hasta.mes - 1;
    if (aDesde > aHasta) {
      throw new AppError("El periodo inicial no puede ser posterior al final", 400);
    }
  }
  if (desde) {
    values.push(desde.anio);
    const anioIdx = values.length;
    values.push(desde.mes);
    const mesIdx = values.length;
    // El parentesis es imprescindible: la clausula tiene un OR propio y se une al resto
    // con AND, asi que sin agrupar el OR se comeria los filtros vecinos.
    whereClauses.push(
      `(m.periodo_anio > $${anioIdx} OR (m.periodo_anio = $${anioIdx} AND m.periodo_mes >= $${mesIdx}))`
    );
  }
  if (hasta) {
    values.push(hasta.anio);
    const anioIdx = values.length;
    values.push(hasta.mes);
    const mesIdx = values.length;
    whereClauses.push(
      `(m.periodo_anio < $${anioIdx} OR (m.periodo_anio = $${anioIdx} AND m.periodo_mes <= $${mesIdx}))`
    );
  }

  if (q && String(q).trim()) {
    values.push(`%${String(q).trim()}%`);
    const i = `$${values.length}`;
    whereClauses.push(`(
      m.numero_cuota::text ILIKE ${i}
      OR ('Cuota ' || m.numero_cuota) ILIKE ${i}
      OR m.estado ILIKE ${i}
      OR m.monto_meta::text ILIKE ${i}
      OR m.monto_pagado::text ILIKE ${i}
      OR m.periodo_mes::text ILIKE ${i}
      OR m.periodo_anio::text ILIKE ${i}
      OR ${MES_LABEL_SQL} ILIKE ${i}
      OR (${MES_LABEL_SQL} || ' ' || m.periodo_anio) ILIKE ${i}
    )`);
  }
}

// Ejecuta el listado + el resumen (totales y contadores) + la paginación.
async function fetchMensualidades(whereClauses, values, filters = {}) {
  const { lim, off } = parsePagination(filters);
  const where = `WHERE ${whereClauses.join(" AND ")}`;

  const { rows: aggRows } = await pool.query(
    `SELECT
       COUNT(*)::int AS cuotas,
       (COUNT(*) FILTER (WHERE m.estado = 'pagado'))::int AS cuotas_pagadas,
       (COUNT(*) FILTER (WHERE m.estado = 'pendiente'))::int AS cuotas_pendientes,
       (COUNT(*) FILTER (WHERE m.estado = 'pagado_parcial'))::int AS cuotas_parciales,
       COALESCE(SUM(m.monto_meta), 0)::numeric AS total_meta,
       COALESCE(SUM(m.monto_pagado), 0)::numeric AS total_pagado,
       COALESCE(SUM(m.monto_meta - m.monto_pagado), 0)::numeric AS total_pendiente
     FROM mensualidades m
     JOIN contrato ct ON ct.id = m.contrato_id
     JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
     JOIN inmuebles i ON i.id = af.inmueble_id
     ${where}`,
    values
  );
  const resumen = aggRows[0];

  const listValues = [...values, lim, off];
  const { rows } = await pool.query(
    `${MENSUALIDAD_SELECT}
     ${where}
     ORDER BY ct.fecha_inicio DESC, ct.id DESC, m.numero_cuota ASC
     LIMIT $${listValues.length - 1}
     OFFSET $${listValues.length}`,
    listValues
  );

  return {
    data: rows,
    resumen,
    pagination: buildPagination(lim, off, resumen.cuotas),
  };
}

// Mensualidades de UN contrato (filtros: estado, contrato_id; paginación:
// limit/offset o page). 404 si el contrato está fuera del alcance del usuario.
exports.listMensualidadesDeContrato = async (scope, contratoId, filters = {}) => {
  const id = parseId(contratoId);

  // Verifica que el contrato exista y pertenezca al alcance (cliente/corredor).
  const chkValues = [];
  const chkClauses = [scopeWhere(scope, chkValues)];
  chkValues.push(id);
  chkClauses.push(`ct.id = $${chkValues.length}`);

  const { rows: chk } = await pool.query(
    `SELECT 1
       FROM contrato ct
       JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
       JOIN inmuebles i ON i.id = af.inmueble_id
      WHERE ${chkClauses.join(" AND ")}
      LIMIT 1`,
    chkValues
  );
  if (!chk.length) throw new AppError("Contrato no encontrado", 404);

  const values = [];
  const whereClauses = [scopeWhere(scope, values)];
  values.push(id);
  whereClauses.push(`m.contrato_id = $${values.length}`);
  applyMensualidadFilters(filters, whereClauses, values);

  const result = await fetchMensualidades(whereClauses, values, filters);
  return { contrato_id: id, ...result };
};

// Mensualidades de TODOS los contratos sobre un inmueble en alquiler (útil para
// el corredor dueño y para el cliente inquilino). 404 si el inmueble no existe
// o está fuera del alcance; lista vacía si aún no tiene contratos.
exports.listMensualidadesDeInmueble = async (scope, inmuebleId, filters = {}) => {
  const id = parseId(inmuebleId);

  const chkValues = [id];
  const chkScope = inmuebleScopeWhere(scope, chkValues);
  const { rows: chk } = await pool.query(
    `SELECT i.id, i.uuid, i.titulo, i.precio
       FROM inmuebles i
      WHERE i.id = $1 AND ${chkScope}
      LIMIT 1`,
    chkValues
  );
  if (!chk.length) throw new AppError("Inmueble no encontrado", 404);

  const values = [id];
  const whereClauses = [`i.id = $1`, inmuebleScopeWhere(scope, values)];
  applyMensualidadFilters(filters, whereClauses, values);

  const result = await fetchMensualidades(whereClauses, values, filters);
  return {
    inmueble: { id: chk[0].id, uuid: chk[0].uuid, titulo: chk[0].titulo, precio: chk[0].precio },
    ...result,
  };
};