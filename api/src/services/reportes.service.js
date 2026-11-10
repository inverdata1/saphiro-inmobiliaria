const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const { ESTATUS_EXPR } = require("./inmuebles.service");

// Valida el rango de fechas de un reporte: `desde` no puede ser mayor que `hasta`.
function validarRangoFechas({ desde, hasta }) {
  if (desde && hasta && String(desde) > String(hasta)) {
    throw new AppError("'desde' no puede ser mayor que 'hasta'", 400);
  }
}

// ---------------------------------------------------------------------------
// Alcance por corredor (scope): una transacción pertenece al corredor si el
// inmueble es suyo O la comisión es suya. Requiere el alias `t` (transacciones).
// ---------------------------------------------------------------------------
function pushScopeCorredor(filters, values, corredorId) {
  if (!corredorId) return;
  values.push(Number(corredorId));
  const p = `$${values.length}`;
  filters.push(
    `(EXISTS (SELECT 1 FROM inmuebles _i WHERE _i.id = t.inmueble_id AND _i.corredor_id = ${p})` +
      ` OR EXISTS (SELECT 1 FROM comisiones _c WHERE _c.transaccion_id = t.id AND _c.corredor_id = ${p}))`
  );
}

function buildTxWhere({ desde, hasta, tipo_operacion }) {
  const filters = [];
  const values = [];

  if (tipo_operacion) {
    values.push(tipo_operacion);
    filters.push(`t.tipo_operacion = $${values.length}`);
  }
  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion >= $${values.length}`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion <= $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  return { where, values };
}

exports.getResumen = async (query) => {
  const { desde, hasta, tipo_operacion } = query;
  const { where, values } = buildTxWhere({ desde, hasta, tipo_operacion });

  const totalsSql = `
    SELECT
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COALESCE(SUM(t.monto_total), 0) AS monto_total_sum,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum,
      COALESCE(SUM(c.empresa_ganancia), 0) AS ganancia_empresa_sum
    FROM transacciones t
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    ${where};
  `;

  const topSql = `
    SELECT
      c.corredor_id,
      u.nombre AS corredor_nombre,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN corredores co ON co.id = c.corredor_id
    JOIN usuarios u ON u.id = co.usuario_id
    ${where}
    GROUP BY c.corredor_id, u.nombre
    ORDER BY comision_total DESC
    LIMIT 5;
  `;

  const [totals, top] = await Promise.all([
    pool.query(totalsSql, values),
    pool.query(topSql, values),
  ]);

  return {
    filtros: { desde: desde || null, hasta: hasta || null, tipo_operacion: tipo_operacion || null },
    ...totals.rows[0],
    top_corredores: top.rows,
  };
};

exports.getTopCorredores = async (query) => {
  const { desde, hasta, limit = 5 } = query;

  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion >= $${values.length}`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion <= $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  values.push(Math.min(Number(limit) || 5, 50));
  const limitIdx = values.length;

  const sql = `
    SELECT
      c.corredor_id,
      u.nombre AS corredor_nombre,
      u.email AS corredor_email,
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum,
      COALESCE(SUM(c.empresa_ganancia), 0) AS ganancia_empresa_sum
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN corredores co ON co.id = c.corredor_id
    JOIN usuarios u ON u.id = co.usuario_id
    ${where}
    GROUP BY c.corredor_id, u.nombre, u.email
    ORDER BY comision_total_sum DESC
    LIMIT $${limitIdx};
  `;

  const r = await pool.query(sql, values);
  return { data: r.rows, meta: { desde: desde || null, hasta: hasta || null } };
};

exports.getPorTipoOperacion = async (query) => {
  const { desde, hasta } = query;

  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion >= $${values.length}`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion <= $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
    SELECT
      t.tipo_operacion,
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COALESCE(SUM(t.monto_total), 0) AS monto_total_sum,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum
    FROM transacciones t
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    ${where}
    GROUP BY t.tipo_operacion
    ORDER BY monto_total_sum DESC;
  `;

  const r = await pool.query(sql, values);
  return { data: r.rows, meta: { desde: desde || null, hasta: hasta || null } };
};

exports.getEstatusPago = async (query) => {
  const { desde, hasta } = query;

  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion >= $${values.length}`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion <= $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
    SELECT
      t.estatus_pago,
      COUNT(c.id)::int AS comisiones_count,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    ${where}
    GROUP BY t.estatus_pago
    ORDER BY comision_total_sum DESC;
  `;

  const r = await pool.query(sql, values);
  return { data: r.rows, meta: { desde: desde || null, hasta: hasta || null } };
};

exports.listTransacciones = async (query) => {
  const {
    desde,
    hasta,
    tipo_operacion,
    inmueble_id,
    cliente_id,
    corredor_id,
    limit = 100,
    offset = 0,
  } = query;

  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion < ($${values.length}::date + interval '1 day')`);
  }
  if (tipo_operacion) {
    values.push(tipo_operacion);
    filters.push(`t.tipo_operacion = $${values.length}`);
  }
  if (inmueble_id) {
    values.push(Number(inmueble_id));
    filters.push(`t.inmueble_id = $${values.length}`);
  }
  if (cliente_id) {
    values.push(Number(cliente_id));
    filters.push(`t.cliente_id = $${values.length}`);
  }
  if (corredor_id) {
    values.push(Number(corredor_id));
    filters.push(`i.corredor_id = $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  values.push(Math.min(Number(limit) || 100, 200));
  const limIdx = values.length;

  values.push(Math.max(Number(offset) || 0, 0));
  const offIdx = values.length;

  const sql = `
    SELECT
      t.*,
      i.titulo AS inmueble_titulo,
      i.corredor_id,
      u.nombre AS cliente_nombre,
      c.id AS comision_id,
      c.monto_comision,
      c.empresa_ganancia
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN usuarios u ON u.id = t.cliente_id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    ${where}
    ORDER BY t.id DESC
    LIMIT $${limIdx} OFFSET $${offIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return rows;
};

// ---------------------------------------------------------------------------
// Reportes por tipo (REPORT_TYPES.value de ReportesPage.jsx)
// Todos aceptan { desde, hasta } en formato YYYY-MM-DD sobre fecha_transaccion.
// ---------------------------------------------------------------------------

// Filtro de rango de fechas sobre una columna timestamp/date.
// `hasta` es inclusive en el día completo (< fecha + 1 día).
function pushRangoFechas(filters, values, col, { desde, hasta } = {}) {
  if (desde) {
    values.push(desde);
    filters.push(`${col} >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`${col} < ($${values.length}::date + interval '1 day')`);
  }
}

// GET /reportes/ventas — transacciones de tipo 'venta' con inmueble, cliente, corredor y comisión
exports.getVentas = async (query, corredorId) => {
  const { desde, hasta } = query;
  validarRangoFechas({ desde, hasta });
  const filters = [`t.tipo_operacion = 'venta'`];
  const values = [];
  pushRangoFechas(filters, values, "t.fecha_transaccion", { desde, hasta });
  pushScopeCorredor(filters, values, corredorId);

  const sql = `
    SELECT
      t.id,
      t.fecha_transaccion,
      t.monto_total,
      t.moneda,
      t.estatus_pago,
      t.numero_factura,
      i.titulo AS inmueble_titulo,
      i.estado_inmueble,
      cl.nombre AS cliente_nombre,
      cl.email AS cliente_email,
      uco.nombre AS corredor_nombre,
      c.monto_comision,
      c.porcentaje_aplicado,
      c.empresa_ganancia,
      c.fecha_pago AS fecha_pago_comision
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN usuarios cl ON cl.id = t.cliente_id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    LEFT JOIN corredores co ON co.id = c.corredor_id
    LEFT JOIN usuarios uco ON uco.id = co.usuario_id
    WHERE ${filters.join(" AND ")}
    ORDER BY t.fecha_transaccion DESC NULLS LAST, t.id DESC;
  `;

  const { rows } = await pool.query(sql, values);
  return { data: rows, meta: { desde: desde || null, hasta: hasta || null } };
};

// GET /reportes/alquileres — transacciones de tipo 'alquiler' (+ datos de reserva si la hay)
exports.getAlquileres = async (query, corredorId) => {
  const { desde, hasta } = query;
  validarRangoFechas({ desde, hasta });
  const filters = [`t.tipo_operacion = 'alquiler'`];
  const values = [];
  pushRangoFechas(filters, values, "t.fecha_transaccion", { desde, hasta });
  pushScopeCorredor(filters, values, corredorId);

  const sql = `
    SELECT
      t.id,
      t.fecha_transaccion,
      t.monto_total,
      t.moneda,
      t.estatus_pago,
      t.numero_factura,
      i.titulo AS inmueble_titulo,
      i.estado_inmueble,
      cl.nombre AS cliente_nombre,
      cl.email AS cliente_email,
      uco.nombre AS corredor_nombre,
      rv.fecha_entrada,
      rv.fecha_salida,
      rv.num_huespedes,
      c.monto_comision,
      c.fecha_pago AS fecha_pago_comision
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN usuarios cl ON cl.id = t.cliente_id
    LEFT JOIN reservas_vacacionales rv ON rv.transaccion_id = t.id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    LEFT JOIN corredores co ON co.id = c.corredor_id
    LEFT JOIN usuarios uco ON uco.id = co.usuario_id
    WHERE ${filters.join(" AND ")}
    ORDER BY t.fecha_transaccion DESC NULLS LAST, t.id DESC;
  `;

  const { rows } = await pool.query(sql, values);
  return { data: rows, meta: { desde: desde || null, hasta: hasta || null } };
};

// GET /reportes/disponibilidad-propiedades — inmuebles vivos con su estatus derivado
// (?estatus= para acotar: disponible/reservado/alquilado/vendido, coma-separado)
exports.getDisponibilidadPropiedades = async (query, corredorId) => {
  const { desde, hasta, estatus } = query;
  validarRangoFechas({ desde, hasta });
  const filters = [`i.deleted_at IS NULL`];
  const values = [];

  // ESTATUS_EXPR viene de inmuebles.service.js — misma regla que el catálogo.
  // Usa el alias `i` para la tabla inmuebles.
  if (estatus) {
    const lista = String(estatus).split(",").map((s) => s.trim()).filter(Boolean);
    if (lista.length) {
      const placeholders = lista.map((v) => {
        values.push(v);
        return `$${values.length}`;
      });
      filters.push(`(${ESTATUS_EXPR}) IN (${placeholders.join(", ")})`);
    }
  }
  pushRangoFechas(filters, values, "i.fecha_publicacion", { desde, hasta });

  // Disponibilidad: solo inmuebles del corredor.
  if (corredorId) {
    values.push(Number(corredorId));
    filters.push(`i.corredor_id = $${values.length}`);
  }

  const sql = `
    SELECT
      i.id,
      i.titulo,
      ti.nombre AS tipo,
      i.estado_inmueble,
      i.precio,
      i.moneda,
      i.area_m2,
      ci.nombre AS ciudad,
      e.nombre AS estado,
      uco.nombre AS corredor_nombre,
      i.fecha_publicacion,
      i.promedio_estrellas,
      (${ESTATUS_EXPR}) AS estatus
    FROM inmuebles i
    JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
    LEFT JOIN ciudades ci ON ci.id = i.ciudad_id
    LEFT JOIN estados e ON e.id = ci.estado_id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    LEFT JOIN usuarios uco ON uco.id = co.usuario_id
    WHERE ${filters.join(" AND ")}
    ORDER BY i.fecha_publicacion DESC NULLS LAST, i.id DESC;
  `;

  const { rows } = await pool.query(sql, values);
  return { data: rows, meta: { desde: desde || null, hasta: hasta || null } };
};

// GET /reportes/ingresos — comisiones de la empresa (empresa_ganancia) por transacción
exports.getIngresos = async (query, corredorId) => {
  const { desde, hasta } = query;
  validarRangoFechas({ desde, hasta });
  const filters = [];
  const values = [];
  pushRangoFechas(filters, values, "c.fecha_pago", { desde, hasta });
  pushScopeCorredor(filters, values, corredorId);

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
    SELECT
      c.id,
      c.fecha_pago,
      c.monto_comision,
      c.porcentaje_aplicado,
      c.empresa_ganancia,
      t.id AS transaccion_id,
      t.monto_total,
      t.moneda,
      t.tipo_operacion,
      t.estatus_pago,
      i.titulo AS inmueble_titulo,
      uco.nombre AS corredor_nombre
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN corredores co ON co.id = c.corredor_id
    LEFT JOIN usuarios uco ON uco.id = co.usuario_id
    ${where}
    ORDER BY c.fecha_pago DESC NULLS LAST, c.id DESC;
  `;

  const { rows } = await pool.query(sql, values);
  return { data: rows, meta: { desde: desde || null, hasta: hasta || null } };
};

// GET /reportes/clientes — usuarios rol=cliente con su actividad
exports.getClientes = async (query, corredorId) => {
  const { desde, hasta } = query;
  validarRangoFechas({ desde, hasta });
  const filters = [`u.rol = 'cliente'`, `u.deleted_at IS NULL`];
  const values = [];
  pushRangoFechas(filters, values, "u.fecha_registro", { desde, hasta });

  // Alcance: el corredor solo ve clientes con transacciones suyas
  // (inmueble del corredor O comisión del corredor) y solo agrega esas.
  let joinScope = "";
  if (corredorId) {
    values.push(Number(corredorId));
    const p = `$${values.length}`;
    joinScope =
      `AND (EXISTS (SELECT 1 FROM inmuebles _i WHERE _i.id = t.inmueble_id AND _i.corredor_id = ${p})` +
      ` OR EXISTS (SELECT 1 FROM comisiones _c WHERE _c.transaccion_id = t.id AND _c.corredor_id = ${p}))`;
    filters.push(`t.id IS NOT NULL`);
  }

  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.email,
      u.fecha_registro,
      u.active,
      u.email_verified,
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COUNT(DISTINCT t.id) FILTER (WHERE t.estatus_pago = 'pagado')::int AS transacciones_pagadas,
      COALESCE(SUM(t.monto_total) FILTER (WHERE t.estatus_pago <> 'cancelado'), 0) AS monto_total_sum,
      COUNT(DISTINCT g.id)::int AS guardados_count
    FROM usuarios u
    LEFT JOIN transacciones t ON t.cliente_id = u.id ${joinScope}
    LEFT JOIN guardados g ON g.usuario_id = u.id
    WHERE ${filters.join(" AND ")}
    GROUP BY u.id
    ORDER BY u.fecha_registro DESC NULLS LAST, u.id DESC;
  `;

  const { rows } = await pool.query(sql, values);
  return { data: rows, meta: { desde: desde || null, hasta: hasta || null } };
};
