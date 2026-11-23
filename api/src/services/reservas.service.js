const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const notificacionesService = require("./notificaciones.service");
const { montoACobrar } = require("../utils/cobroReserva");

let autorizadaLista = false;

async function ensureAutorizada() {
  if (autorizadaLista) return;
  await pool.query(
    `ALTER TABLE reservas_vacacionales
       ADD COLUMN IF NOT EXISTS autorizada boolean NOT NULL DEFAULT false`
  );
  await pool.query(
    `UPDATE reservas_vacacionales rv
        SET autorizada = true
       FROM transacciones t
      WHERE t.id = rv.transaccion_id
        AND t.estatus_pago = 'pagado'
        AND rv.autorizada = false`
  );
  await pool.query(`ALTER TABLE reservas_vacacionales ADD COLUMN IF NOT EXISTS monto_cobrado numeric(12,2)`);
  await pool.query(`ALTER TABLE reservas_vacacionales ADD COLUMN IF NOT EXISTS cobro_modo varchar(10)`);
  await pool.query(`ALTER TABLE reservas_vacacionales ADD COLUMN IF NOT EXISTS noches_cobradas integer`);
  await pool.query(`ALTER TABLE reservas_vacacionales ADD COLUMN IF NOT EXISTS porcentaje_reserva numeric(5,2) NOT NULL DEFAULT 50`);
  await pool.query(`ALTER TABLE alquiler_vacacional ADD COLUMN IF NOT EXISTS porcentaje_reserva numeric(5,2) NOT NULL DEFAULT 50`);
  autorizadaLista = true;
}

exports.ensureAutorizada = ensureAutorizada;

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
    rv.monto_cobrado,
    rv.cobro_modo,
    rv.noches_cobradas,
    rv.fecha_reserva,
    rv.apartado_hasta,
    rv.motivo_cancelacion,
    COALESCE(rv.autorizada, false) AS autorizada,
    (rv.fecha_salida - rv.fecha_entrada) AS total_noches,

    av.precio_por_noche,
    COALESCE(rv.porcentaje_reserva, av.porcentaje_reserva, 50) AS porcentaje_reserva,
    av.capacidad_personas,
    av.noches_minimas,
    av.hora_checkin,
    av.hora_checkout,

    i.id AS inmueble_id,
    i.uuid AS inmueble_uuid,
    i.titulo AS inmueble_titulo,
    i.edificio_nombre,
    i.numero_apto,
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
      WHEN COALESCE(rv.autorizada, false) = false AND t.estatus_pago = 'pendiente' THEN 'por_autorizar'
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
  await ensureAutorizada();
  await pool.query(
    `UPDATE transacciones t
        SET estatus_pago = 'cancelado'
       FROM reservas_vacacionales rv
      WHERE rv.transaccion_id = t.id
        AND t.estatus_pago = 'pendiente'
        AND COALESCE(rv.autorizada, false) = false
        AND rv.apartado_hasta IS NOT NULL
        AND rv.apartado_hasta < NOW()`
  );
  await pool.query(
    `UPDATE reservas_vacacionales
        SET motivo_cancelacion = COALESCE(motivo_cancelacion, 'Venció el apartado de 24 horas')
      WHERE apartado_hasta IS NOT NULL
        AND apartado_hasta < NOW()
        AND motivo_cancelacion IS NULL
        AND COALESCE(autorizada, false) = false`
  );
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
    } else if (estado === "por_autorizar") {
      whereClauses.push("COALESCE(rv.autorizada, false) = false AND t.estatus_pago = 'pendiente'");
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
  await ensureAutorizada();
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

  const cal = await pool.query(
    `SELECT estrellas_corredor, comentario_inmueble, comentario_corredor
       FROM calificaciones_reserva WHERE reserva_id = $1`,
    [reserva.reserva_id]
  );
  reserva.calificacion = cal.rows[0] || null;
  return reserva;
};

exports.autorizarReserva = async (id, user) => {
  await ensureAutorizada();
  const reserva = await exports.getReservaById(id, user);
  const esCorredor = Number(user?.id) === Number(reserva.corredor_usuario_id);
  if (!user || (user.rol !== "admin" && !esCorredor)) {
    throw new AppError("Solo la inmobiliaria de ese inmueble puede autorizar la reserva", 403);
  }
  if (reserva.estatus_pago === "cancelado") {
    throw new AppError("La reserva está cancelada", 400);
  }
  if (reserva.estatus_pago === "pagado") {
    throw new AppError("La reserva ya está pagada", 400);
  }
  await pool.query(`UPDATE reservas_vacacionales SET autorizada = true, apartado_hasta = NULL WHERE id = $1`, [Number(id)]);
  if (reserva.cliente_id) {
    await notificacionesService.create({
      usuario_id: reserva.cliente_id,
      titulo: "Reserva autorizada",
      descripcion: `La inmobiliaria autorizó tu reserva en ${reserva.inmueble_titulo}. Ya puedes pagar.`,
      tipo_notificacion: "Transaccion",
      enlace: `/pagar-reserva/${id}`,
    });
  }
  return exports.getReservaById(id, user);
};

exports.pagarReserva = async (id, user, body = {}) => {
  await ensureAutorizada();
  const reserva = await exports.getReservaById(id, user);
  if (user && user.rol !== "admin" && Number(user.id) !== Number(reserva.cliente_id)) {
    throw new AppError("No autorizado para pagar esta reserva", 403);
  }
  if (!reserva.autorizada) {
    throw new AppError("La inmobiliaria todavía no autoriza esta reserva", 403);
  }
  if (reserva.estatus_pago === "cancelado") {
    throw new AppError("La reserva está cancelada", 400);
  }
  if (reserva.estatus_pago === "pagado") {
    return reserva;
  }
  let cobro;
  try {
    cobro = montoACobrar({
      total: reserva.precio_total,
      precioNoche: reserva.precio_por_noche,
      nochesEstadia: Number(reserva.total_noches),
      modo: body.modo,
      noches: body.noches,
      porcentaje: reserva.porcentaje_reserva,
    });
  } catch (err) {
    if (err.code === "NOCHES") throw new AppError(err.message, 400);
    throw err;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pago = await client.query(
      `UPDATE transacciones SET estatus_pago = 'pagado' WHERE id = $1 AND estatus_pago = 'pendiente'`,
      [reserva.transaccion_id]
    );
    if (pago.rowCount !== 1) {
      await client.query("ROLLBACK");
      return exports.getReservaById(id, user);
    }
    await client.query(
      `UPDATE reservas_vacacionales
          SET monto_cobrado = $2, cobro_modo = $3, noches_cobradas = $4
        WHERE id = $1`,
      [reserva.reserva_id, cobro.monto, cobro.modo, cobro.noches]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  const detalleCobro = cobro.modo === "noches"
    ? `${cobro.noches} noche${cobro.noches > 1 ? "s" : ""}`
    : `el ${cobro.porcentaje ?? 50}% del total`;
  await notificacionesService.createToAllAdmins({
    titulo: "Pago de reserva",
    descripcion: `${reserva.cliente_nombre} pagó la inicial (${detalleCobro}) de la reserva en ${reserva.inmueble_titulo}.`,
    tipo_notificacion: "Transaccion",
  });
  return exports.getReservaById(id, user);
};

exports.listReservasDeCliente = async (clienteId, filters = {}) => {
  return exports.listReservas({ id: clienteId, rol: "cliente" }, filters);
};

exports.listReservasDeCorredor = async (usuarioId, filters = {}) => {
  return exports.listReservas({ id: usuarioId, rol: "corredor" }, filters);
};

exports.cancelarReserva = async (id, user, body = {}) => {
  const motivo = String(body.motivo || "").trim();
  if (motivo.length < 3) throw new AppError("Indica por qué se cancela", 400);
  const reserva = await exports.getReservaById(id, user);
  const esCliente = Number(user?.id) === Number(reserva.cliente_id);
  const esCorredor = Number(user?.id) === Number(reserva.corredor_usuario_id);
  if (!user || (user.rol !== "admin" && !esCliente && !esCorredor)) {
    throw new AppError("No puedes cancelar esta reserva", 403);
  }
  if (reserva.estatus_pago === "cancelado") return reserva;
  await pool.query(`UPDATE transacciones SET estatus_pago = 'cancelado' WHERE id = $1`, [reserva.transaccion_id]);
  await pool.query(
    `UPDATE reservas_vacacionales SET motivo_cancelacion = $2, apartado_hasta = NULL WHERE id = $1`,
    [reserva.reserva_id, motivo.slice(0, 300)]
  );
  await notificacionesService.createToAllAdmins({
    titulo: "Reserva cancelada",
    descripcion: `Se canceló la reserva ${reserva.reserva_id}. Motivo: ${motivo.slice(0, 180)}`,
    tipo_notificacion: "Transaccion",
    enlace: `/reservaciones?reserva=${reserva.reserva_id}`,
  });
  return exports.getReservaById(id, user);
};

exports.prolongarReserva = async (id, user) => {
  const reserva = await exports.getReservaById(id, user);
  const esCorredor = Number(user?.id) === Number(reserva.corredor_usuario_id);
  if (!user || (user.rol !== "admin" && !esCorredor)) {
    throw new AppError("Solo la inmobiliaria puede prolongar el apartado", 403);
  }
  await pool.query(
    `UPDATE reservas_vacacionales SET apartado_hasta = NOW() + INTERVAL '24 hours' WHERE id = $1`,
    [reserva.reserva_id]
  );
  return exports.getReservaById(id, user);
};

exports.calificarReserva = async (id, user, body = {}) => {
  const reserva = await exports.getReservaById(id, user);
  if (Number(user?.id) !== Number(reserva.cliente_id)) {
    throw new AppError("Solo el huésped puede calificar", 403);
  }
  if (reserva.estado_estancia !== "finalizada") {
    throw new AppError("La estadía todavía no termina", 400);
  }
  const estrellas = Number(body.estrellas);
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw new AppError("Las estrellas van de 1 a 5", 400);
  }
  const comentarioInmueble = String(body.comentario_inmueble || "").trim().slice(0, 1000);
  const comentarioCorredor = String(body.comentario_corredor || "").trim().slice(0, 1000);
  await pool.query(
    `INSERT INTO calificaciones_reserva (reserva_id, cliente_id, comentario_inmueble, estrellas_corredor, comentario_corredor)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (reserva_id) DO NOTHING`,
    [reserva.reserva_id, user.id, comentarioInmueble, estrellas, comentarioCorredor]
  );
  if (reserva.inmueble_id && comentarioInmueble) {
    await pool.query(
      `INSERT INTO resenas (inmueble_id, usuario_id, estrellas, comentario, fecha_publicacion)
       VALUES ($1, $2, $3, $4, NOW())`,
      [reserva.inmueble_id, user.id, estrellas, comentarioInmueble]
    );
  }
  if (estrellas <= 2) {
    await notificacionesService.createToAllAdmins({
      titulo: "Calificación negativa",
      descripcion: `${reserva.cliente_nombre} calificó con ${estrellas} estrellas. ${comentarioCorredor || comentarioInmueble || "Sin comentario."}`.slice(0, 240),
      tipo_notificacion: "Transaccion",
      enlace: `/reservaciones?reserva=${reserva.reserva_id}`,
    });
  }
  return exports.getReservaById(id, user);
};
