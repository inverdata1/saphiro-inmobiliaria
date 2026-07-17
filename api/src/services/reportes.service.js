const pool = require("../db/pool");

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
      c.empresa_ganancia,
      c.estatus_pago
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
