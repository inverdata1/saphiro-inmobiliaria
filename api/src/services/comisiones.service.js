const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");

exports.listComisiones = async (filters) => {
  const {
    corredor_id,
    transaccion_id,
    desde,
    hasta,
    limit = 100,
    offset = 0,
  } = filters;


  const whereClauses = [];
  const values = [];

  if (corredor_id) {
    values.push(Number(corredor_id));
    whereClauses.push(`usuario_id = $${values.length}`);
  }
  if (transaccion_id) {
    values.push(Number(transaccion_id));
    whereClauses.push(`c.transaccion_id = $${values.length}`);
  }

  if (desde) {
    values.push(desde);
    whereClauses.push(`c.fecha_pago::date >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    whereClauses.push(`c.fecha_pago::date <= $${values.length}::date`);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const lim = Math.min(Number(limit) || 100, 200);
  const off = Number(offset) || 0;

  values.push(lim);
  const limitIdx = values.length;

  values.push(off);
  const offsetIdx = values.length;

  const sql = `
    SELECT
      c.id,
      c.transaccion_id,
      c.corredor_id,
      c.monto_comision,
      c.porcentaje_aplicado,
      c.empresa_ganancia,
      c.fecha_pago,

      t.tipo_operacion,
      t.monto_total,
      t.fecha_transaccion,

      i.id     AS inmueble_id,
      i.titulo AS inmueble_titulo,

      uco.nombre AS corredor_nombre,
      uco.email  AS corredor_email,
      uco.id AS usuario_id

    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN inmuebles i ON i.id = t.inmueble_id
    JOIN corredores co ON co.id = c.corredor_id
    JOIN usuarios uco ON uco.id = co.usuario_id

    ${where}

    ORDER BY c.fecha_pago DESC NULLS LAST, c.id DESC
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return { data: rows, pagination: { limit: lim, offset: off } };
};

exports.getComisionById = async (id) => {
  const sql = `
    SELECT
      c.*,
      t.tipo_operacion,
      t.monto_total,
      t.fecha_transaccion,
      i.titulo AS inmueble_titulo,
      uco.nombre AS corredor_nombre,
      uco.email  AS corredor_email
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN inmuebles i ON i.id = t.inmueble_id
    JOIN corredores co ON co.id = c.corredor_id
    JOIN usuarios uco ON uco.id = co.usuario_id
    WHERE c.id = $1;
  `;

  const { rows } = await pool.query(sql, [id]);
  if (!rows.length) throw new AppError("Comisión no existe", 404);
  return rows[0];
};

exports.updateEstatusPago = async (id, body, ctx) => {
  const { estatus_pago, fecha_pago } = body;

  if (!["pendiente", "pagado", "cancelado"].includes(estatus_pago)) {
    throw new AppError("estatus_pago inválido (use: pendiente|pagado|cancelado)", 400);
  }

  const sql = `
    UPDATE comisiones
    SET
      estatus_pago = $1::varchar,
      fecha_pago = CASE
        WHEN $1::varchar = 'pagado' THEN COALESCE($2::timestamptz, CURRENT_TIMESTAMP)
        ELSE NULL
      END
    WHERE id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, [estatus_pago, fecha_pago || null, id]);

  if (!rows.length) throw new AppError("Comisión no existe", 404);

  if (ctx) {
    await auditoriaService.registrarUpdate({
      usuario_id: ctx.usuario_id,
      tabla_afectada: "comisiones",
      descripcion: `Actualizado estatus de comisión ${id} a "${estatus_pago}"`,
      ip_address: ctx.ip_address,
      user_agent: ctx.user_agent,
    });
  }

  return rows[0];
};
