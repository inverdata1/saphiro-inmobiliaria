const pool = require("../db/pool");
const AppError = require("../utils/AppError");

exports.create = async ({ usuario_id, titulo, descripcion, tipo_notificacion }) => {
  if (!usuario_id || !titulo || !descripcion) {
    throw new AppError("usuario_id, titulo y descripcion son requeridos", 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO notificaciones (usuario_id, titulo, descripcion, tipo_notificacion)
     VALUES ($1, $2, $3, $4)
     RETURNING *;`,
    [usuario_id, titulo, descripcion, tipo_notificacion || null]
  );
  return rows[0];
};

exports.getByUser = async (usuario_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM notificaciones
     WHERE usuario_id = $1
     ORDER BY fecha_hora DESC;`,
    [usuario_id]
  );
  return rows;
};

exports.getUnreadByUser = async (usuario_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM notificaciones
     WHERE usuario_id = $1 AND leida = FALSE
     ORDER BY fecha_hora DESC;`,
    [usuario_id]
  );
  return rows;
};

exports.markAsRead = async (id) => {
  const { rows } = await pool.query(
    `UPDATE notificaciones
     SET leida = TRUE
     WHERE id = $1
     RETURNING *;`,
    [id]
  );
  if (!rows.length) throw new AppError("Notificación no encontrada", 404);
  return rows[0];
};

exports.markAllAsRead = async (usuario_id) => {
  const { rowCount } = await pool.query(
    `UPDATE notificaciones
     SET leida = TRUE
     WHERE usuario_id = $1 AND leida = FALSE;`,
    [usuario_id]
  );
  return { updated: rowCount };
};

exports.remove = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM notificaciones
     WHERE id = $1
     RETURNING id;`,
    [id]
  );
  if (!rows.length) throw new AppError("Notificación no encontrada", 404);
};

exports.removeAllByUser = async (usuario_id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM notificaciones
     WHERE usuario_id = $1;`,
    [usuario_id]
  );
  return { deleted: rowCount };
};
