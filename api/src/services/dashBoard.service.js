const pool = require("../db/pool");
const AppError = require("../utils/AppError");

function buildTxWhere({ desde, hasta }) {
  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion::date >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion::date <= $${values.length}::date`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  return { where, values };
}

exports.getKpis = async (query) => {
  const { desde, hasta, tipo_operacion } = query;
  const { where, values } = buildTxWhere({ desde, hasta });
  //comision_pagada_sum
  //comision_pendiente_sum
  //comision_cancelada_sum
  const sql = `
    SELECT
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COALESCE(SUM(t.monto_total), 0) AS monto_total_sum,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum,
      COALESCE(SUM(c.empresa_ganancia), 0) AS ganancia_empresa_sum,

      COALESCE(SUM(CASE WHEN t.estatus_pago = 'pagado' THEN t.monto_total ELSE 0 END), 0) AS monto_total_pagado,
      COALESCE(SUM(CASE WHEN t.estatus_pago = 'pendiente' THEN t.monto_total ELSE 0 END), 0) AS monto_total_pendiente,
      COALESCE(SUM(CASE WHEN t.estatus_pago = 'cancelado' THEN t.monto_total ELSE 0 END), 0) AS monto_total_cancelado
    FROM transacciones t
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    ${where};
  `;

  const r = await pool.query(sql, values);
  const kpis = r.rows[0];

  const txCount = Number(kpis.transacciones_count || 0);
  const montoTotal = Number(kpis.monto_total_sum || 0);
  const ticketPromedio = txCount > 0 ? montoTotal / txCount : 0;

  return {
    filtros: { desde: desde || null, hasta: hasta || null, tipo_operacion: tipo_operacion || null },
    ...kpis,
    ticket_promedio: Number(ticketPromedio.toFixed(2)),
  };
};

exports.getSerie = async (query) => {
  const { desde, hasta, tipo_operacion, granularidad = "dia" } = query;
  const { where, values } = buildTxWhere({ desde, hasta, tipo_operacion });

  const bucket =
    granularidad === "mes"
      ? `date_trunc('month', t.fecha_transaccion)`
      : `date_trunc('day', t.fecha_transaccion)`;

  const sql = `
    SELECT
      ${bucket} AS periodo,
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COALESCE(SUM(t.monto_total), 0) AS monto_total_sum,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum,
      COALESCE(SUM(c.empresa_ganancia), 0) AS ganancia_empresa_sum
    FROM transacciones t
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    ${where}
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const r = await pool.query(sql, values);
  return {
    data: r.rows,
    meta: { granularidad, desde: desde || null, hasta: hasta || null, tipo_operacion: tipo_operacion || null },
  };
};

exports.getTopCorredores = async (query) => {
  const { desde, hasta, limit = 5 } = query;

  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion::date >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion::date <= $${values.length}::date`);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  values.push(Math.min(Number(limit) || 5, 50));
  const limitIdx = values.length;

  const sql = `
    SELECT
      c.corredor_id,
      u.nombre AS corredor_nombre,
      u.email  AS corredor_email,
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
      c.estatus_pago,
      COUNT(c.id)::int AS comisiones_count,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    ${where}
    GROUP BY c.estatus_pago
    ORDER BY comision_total_sum DESC;
  `;

  const r = await pool.query(sql, values);
  return { data: r.rows, meta: { desde: desde || null, hasta: hasta || null } };
};

exports.getDashboardCorredor = async (corredor_id, query) => {
  const { desde, hasta } = query;

  const filters = [`c.corredor_id = $1`];
  const values = [corredor_id];

  if (desde) {
    values.push(desde);
    filters.push(`t.fecha_transaccion >= $${values.length}`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`t.fecha_transaccion <= $${values.length}`);
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const kpiSql = `
    SELECT
      COUNT(DISTINCT t.id)::int AS transacciones_count,
      COALESCE(SUM(c.monto_comision), 0) AS comision_total_sum,
      COALESCE(SUM(c.empresa_ganancia), 0) AS ganancia_empresa_sum,
      COALESCE(SUM(CASE WHEN c.estatus_pago='pagado' THEN c.monto_comision ELSE 0 END), 0) AS comision_pagada_sum,
      COALESCE(SUM(CASE WHEN c.estatus_pago='pendiente' THEN c.monto_comision ELSE 0 END), 0) AS comision_pendiente_sum
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    ${where};
  `;

  const detalleSql = `
    SELECT
      c.id AS comision_id,
      c.estatus_pago,
      c.monto_comision,
      c.empresa_ganancia,
      c.fecha_pago,
      t.id AS transaccion_id,
      t.tipo_operacion,
      t.monto_total,
      t.fecha_transaccion,
      i.id AS inmueble_id,
      i.titulo AS inmueble_titulo
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN inmuebles i ON i.id = t.inmueble_id
    ${where}
    ORDER BY t.fecha_transaccion DESC, c.id DESC
    LIMIT 100;
  `;

  const corredorSql = `
    SELECT co.id, u.nombre, u.email
    FROM corredores co
    JOIN usuarios u ON u.id = co.usuario_id
    WHERE co.id = $1;
  `;

  const [corredorInfo, kpi, detalle] = await Promise.all([
    pool.query(corredorSql, [corredor_id]),
    pool.query(kpiSql, values),
    pool.query(detalleSql, values),
  ]);

  if (!corredorInfo.rows.length) throw new AppError("Corredor no existe", 404);

  return {
    corredor: corredorInfo.rows[0],
    filtros: { desde: desde || null, hasta: hasta || null },
    kpis: kpi.rows[0],
    ultimas_comisiones: detalle.rows,
  };
};
