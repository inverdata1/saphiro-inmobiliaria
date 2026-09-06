const pool = require("../db/pool");

exports.listAuditoria = async (query) => {
  const {
    desde,
    hasta,
    tabla_afectada,
    accion,
    usuario_id,
    registro_id,
    limit = 100,
    offset = 0,
  } = query;

  const filters = [];
  const values = [];

  if (desde) {
    values.push(desde);
    filters.push(`a.fecha_hora >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    filters.push(`a.fecha_hora < ($${values.length}::date + interval '1 day')`);
  }
  if (tabla_afectada) {
    values.push(tabla_afectada);
    filters.push(`a.tabla_afectada = $${values.length}`);
  }
  if (usuario_id) {
    values.push(Number(usuario_id));
    filters.push(`a.usuario_id = $${values.length}`);
  }
  if (registro_id) {
    values.push(Number(registro_id));
    filters.push(`a.registro_id = $${values.length}`);
  }
  if (accion) {
    values.push(`%${accion}%`);
    filters.push(`a.accion ILIKE $${values.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const lim = Math.min(Number(limit || 100), 200);
  const off = Math.max(Number(offset || 0), 0);

  const countSql = `SELECT COUNT(*)::int AS total FROM bitacora_auditoria a ${where};`;
  const { rows: countRows } = await pool.query(countSql, values);
  const total = Number(countRows[0]?.total || 0);

  values.push(lim);
  const limIdx = values.length;
  values.push(off);
  const offIdx = values.length;

  const sql = `
    SELECT
      a.*,
      u.nombre AS usuario_nombre,
      u.email  AS usuario_email
    FROM bitacora_auditoria a
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    ${where}
    ORDER BY a.id DESC
    LIMIT $${limIdx} OFFSET $${offIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return {
    data: rows,
    pagination: { page: Math.floor(off / lim) + 1, limit: lim, offset: off, total },
  };
};

//Si se recibe un client, la auditoría forma parte de la transacción del llamador
exports.registrarInsert = async ({ usuario_id, tabla_afectada, descripcion, ip_address, user_agent }, client = null) => {
  const db = client || pool;
  await db.query("CALL sp_registrar_auditoria_ins($1, $2, $3, $4, $5)", [
    usuario_id, tabla_afectada, descripcion, ip_address, user_agent,
  ]);
};

exports.registrarUpdate = async ({ usuario_id, tabla_afectada, descripcion, ip_address, user_agent }, client = null) => {
  const db = client || pool;
  await db.query("CALL sp_registrar_auditoria_up($1, $2, $3, $4, $5)", [
    usuario_id, tabla_afectada, descripcion, ip_address, user_agent,
  ]);
};

exports.registrarDelete = async ({ usuario_id, tabla_afectada, descripcion, ip_address, user_agent }, client = null) => {
  const db = client || pool;
  await db.query("CALL sp_registrar_auditoria_del($1, $2, $3, $4, $5)", [
    usuario_id, tabla_afectada, descripcion, ip_address, user_agent,
  ]);
};
