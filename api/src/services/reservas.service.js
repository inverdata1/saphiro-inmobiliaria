const pool = require("../db/pool");
const AppError = require("../utils/AppError");

function parsePagination({ limit, offset, page } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 100, 1), 200);
  let off = Math.max(Number(offset) || 0, 0);
  if (!offset && page) {
    off = (Math.max(Number(page) || 1, 1) - 1) * lim;
  }
  return { lim, off };
}

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

const RESERVA_SELECT = `
  SELECT
    rv.id AS reserva_id,
    rv.alquiler_vacacional_id,
    rv.cliente_id,
    rv.transaccion_id,
    rv.fecha_entrada,
    rv.fecha_salida,
    rv.num_huespedes,
    rv.precio_total,
    rv.fecha_reserva,
    (rv.fecha_salida - rv.fecha_entrada) AS total_noches,

    av.precio_por_noche,
    av.capacidad_personas,
    av.noches_minimas,
    av.hora_checkin,
    av.hora_checkout,

    i.id AS inmueble_id,
    i.uuid AS inmueble_uuid,
    i.titulo AS inmueble_titulo,
    i.precio AS inmueble_precio,
    i.moneda AS inmueble_moneda,
    i.direccion_exacta AS inmueble_direccion,
    ci.nombre AS inmueble_ciudad,
    es.nombre AS inmueble_region,
    (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS inmueble_imagen_url,

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
    (SELECT nt.nro_telefono FROM nros_telefono nt WHERE nt.corredor_id = co.id LIMIT 1) AS corredor_telefono,

    t.numero_factura,
    COALESCE(t.estatus_pago, 'pagado') AS estatus_pago,
    t.monto_total,
    COALESCE(t.moneda, i.moneda, 'USD') AS moneda,
    t.fecha_transaccion,

    CASE
      WHEN t.estatus_pago = 'cancelado' THEN 'cancelada'
      WHEN CURRENT_DATE < rv.fecha_entrada THEN 'proxima'
      WHEN CURRENT_DATE >= rv.fecha_entrada AND CURRENT_DATE <= rv.fecha_salida THEN 'en_curso'
      ELSE 'finalizada'
    END AS estado_estancia,

    COALESCE((
      SELECT json_agg(json_build_object(
        'mascota_id', m.id,
        'nombre', m.nombre,
        'cantidad', rm.cantidad
      ))
      FROM reservas_mascotas rm
      JOIN mascotas m ON m.id = rm.mascota_id
      WHERE rm.reserva_id = rv.id
    ), '[]'::json) AS mascotas,

    COALESCE((
      SELECT json_agg(json_build_object(
        'concepto', td.concepto,
        'monto', td.monto
      ) ORDER BY td.id)
      FROM transacciones_detalles td
      WHERE td.transaccion_id = t.id
    ), '[]'::json) AS detalles
`;

const RESERVA_FROM = `
  FROM reservas_vacacionales rv
  JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
  JOIN inmuebles i ON i.id = av.inmueble_id
  JOIN usuarios cl ON cl.id = rv.cliente_id
  LEFT JOIN ciudades ci ON ci.id = i.ciudad_id
  LEFT JOIN estados es ON es.id = ci.estado_id
  JOIN corredores co ON co.id = i.corredor_id
  JOIN usuarios cu ON cu.id = co.usuario_id
  LEFT JOIN transacciones t ON t.id = rv.transaccion_id
`;

exports.listReservas = async (user, filters = {}) => {
  const { estado, search, desde, hasta, tipo, inmueble_id } = filters;
  const { lim, off } = parsePagination(filters);

  const values = [];
  const whereClauses = [];

  // Filtro por rol
  if (user.rol === "cliente") {
    values.push(Number(user.id));
    whereClauses.push(`rv.cliente_id = $${values.length}`);
  } else if (user.rol === "corredor") {
    if (tipo === "mias") {
      values.push(Number(user.id));
      whereClauses.push(`rv.cliente_id = $${values.length}`);
    } else {
      // Por defecto para corredor: reservaciones en sus inmuebles
      const { rows: coRows } = await pool.query(
        "SELECT id FROM corredores WHERE usuario_id = $1 LIMIT 1",
        [Number(user.id)]
      );
      if (!coRows.length) {
        return { data: [], pagination: buildPagination(lim, 0, 0) };
      }
      values.push(coRows[0].id);
      whereClauses.push(`i.corredor_id = $${values.length}`);
    }
  } else if (user.rol === "admin") {
    if (filters.cliente_id) {
      values.push(Number(filters.cliente_id));
      whereClauses.push(`rv.cliente_id = $${values.length}`);
    }
    if (filters.corredor_id) {
      values.push(Number(filters.corredor_id));
      whereClauses.push(`i.corredor_id = $${values.length}`);
    }
  }

  // Filtro por inmueble
  if (inmueble_id) {
    values.push(Number(inmueble_id));
    whereClauses.push(`i.id = $${values.length}`);
  }

  // Filtro por estado calculado
  if (estado && estado !== "todas") {
    if (estado === "cancelada") {
      whereClauses.push("t.estatus_pago = 'cancelado'");
    } else if (estado === "proxima") {
      whereClauses.push("(t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado') AND CURRENT_DATE < rv.fecha_entrada");
    } else if (estado === "en_curso") {
      whereClauses.push("(t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado') AND CURRENT_DATE >= rv.fecha_entrada AND CURRENT_DATE <= rv.fecha_salida");
    } else if (estado === "finalizada") {
      whereClauses.push("(t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado') AND CURRENT_DATE > rv.fecha_salida");
    }
  }

  // Filtro por fechas
  if (desde) {
    values.push(desde);
    whereClauses.push(`rv.fecha_salida >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    whereClauses.push(`rv.fecha_entrada <= $${values.length}::date`);
  }

  // Filtro por búsqueda de texto
  if (search && search.trim()) {
    values.push(`%${search.trim()}%`);
    const sIdx = values.length;
    whereClauses.push(`(
      i.titulo ILIKE $${sIdx} OR
      ci.nombre ILIKE $${sIdx} OR
      es.nombre ILIKE $${sIdx} OR
      cl.nombre ILIKE $${sIdx} OR
      cu.nombre ILIKE $${sIdx} OR
      t.numero_factura ILIKE $${sIdx}
    )`);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Conteo total para paginación
  const countSql = `
    SELECT COUNT(*)::int AS total
    ${RESERVA_FROM}
    ${where}
  `;
  const { rows: countRows } = await pool.query(countSql, values);
  const total = Number(countRows[0]?.total || 0);

  values.push(lim);
  const limIdx = values.length;
  values.push(off);
  const offIdx = values.length;

  const dataSql = `
    ${RESERVA_SELECT}
    ${RESERVA_FROM}
    ${where}
    ORDER BY rv.fecha_entrada DESC, rv.id DESC
    LIMIT $${limIdx}
    OFFSET $${offIdx}
  `;

  const { rows } = await pool.query(dataSql, values);

  return {
    data: rows,
    pagination: buildPagination(lim, off, total),
  };
};

exports.getReservaById = async (id, user) => {
  if (!id || !/^\d+$/.test(String(id))) {
    throw new AppError("Reserva no encontrada", 404);
  }

  const { rows } = await pool.query(
    `${RESERVA_SELECT}
     ${RESERVA_FROM}
     WHERE rv.id = $1
     LIMIT 1`,
    [Number(id)]
  );

  if (!rows.length) {
    throw new AppError("Reserva no encontrada", 404);
  }

  const reserva = rows[0];

  // Control de acceso: solo el cliente de la reserva, el corredor del inmueble o un admin pueden verla
  if (user && user.rol !== "admin") {
    const isCliente = Number(user.id) === Number(reserva.cliente_id);
    const isCorredor = Number(user.id) === Number(reserva.corredor_usuario_id);
    if (!isCliente && !isCorredor) {
      throw new AppError("No autorizado para ver esta reserva", 403);
    }
  }

  return reserva;
};

exports.listReservasDeCliente = async (clienteId, filters = {}) => {
  return exports.listReservas({ id: clienteId, rol: "cliente" }, filters);
};

exports.listReservasDeCorredor = async (usuarioId, filters = {}) => {
  return exports.listReservas({ id: usuarioId, rol: "corredor" }, filters);
};
