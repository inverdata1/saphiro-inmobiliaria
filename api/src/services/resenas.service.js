const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");

exports.createResena = async (data, ctx) => {
  const { inmueble_id, usuario_id, estrellas, comentario } = data;

  if (!inmueble_id || !usuario_id || !comentario?.trim()) {
    throw new AppError("inmueble_id, usuario_id y comentario son requeridos", 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO resenas (inmueble_id, usuario_id, estrellas, comentario)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [inmueble_id, usuario_id, estrellas ?? null, comentario.trim()]
  );

  if (ctx) {
    await auditoriaService.registrarInsert({
      usuario_id: ctx.usuario_id,
      tabla_afectada: "resenas",
      descripcion: `Creación de reseña para inmueble ${inmueble_id}`,
      ip_address: ctx.ip_address,
      user_agent: ctx.user_agent,
    });
  }

  return rows[0];
};

exports.getResenasByInmuebleId = async (inmuebleId) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.nombre AS usuario_nombre
     FROM resenas r
     LEFT JOIN usuarios u ON u.id = r.usuario_id
     WHERE r.inmueble_id = $1
     ORDER BY r.fecha_publicacion DESC`,
    [inmuebleId]
  );

  return rows;
};

exports.getResenaByInmuebleAndUsuario = async (inmuebleId, usuarioId) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.nombre AS usuario_nombre
     FROM resenas r
     LEFT JOIN usuarios u ON u.id = r.usuario_id
     WHERE r.inmueble_id = $1 AND r.usuario_id = $2
     LIMIT 1`,
    [inmuebleId, usuarioId]
  );
  return rows[0] || null;
};

exports.getAllResenas = async () => {
  const { rows } = await pool.query(
    `SELECT r.*, u.nombre AS usuario_nombre
     FROM resenas r
     LEFT JOIN usuarios u ON u.id = r.usuario_id
     ORDER BY r.fecha_publicacion DESC`
  );

  return rows;
};

exports.deleteResena = async (id, ctx) => {
  const { rows } = await pool.query(
    `DELETE FROM resenas WHERE id = $1 RETURNING *`,
    [id]
  );

  if (!rows.length) throw new AppError("Reseña no encontrada", 404);

  if (ctx) {
    await auditoriaService.registrarDelete({
      usuario_id: ctx.usuario_id,
      tabla_afectada: "resenas",
      descripcion: `Eliminada reseña ${id}`,
      ip_address: ctx.ip_address,
      user_agent: ctx.user_agent,
    });
  }

  return rows[0];
};

exports.updateResena = async (id, data, ctx) => {
  const { estrellas, comentario } = data;

  const sets = [];
  const values = [];
  let idx = 0;

  if (estrellas !== undefined && estrellas !== null) {
    idx++;
    sets.push(`estrellas = $${idx}`);
    values.push(estrellas);
  }

  if (comentario?.trim()) {
    idx++;
    sets.push(`comentario = $${idx}`);
    values.push(comentario.trim());
  }

  if (!sets.length) throw new AppError("No hay campos para actualizar", 400);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE resenas SET ${sets.join(", ")} WHERE id = $${idx + 1} RETURNING *`,
    values
  );

  if (!rows.length) throw new AppError("Reseña no encontrada", 404);

  if (ctx) {
    await auditoriaService.registrarUpdate({
      usuario_id: ctx.usuario_id,
      tabla_afectada: "resenas",
      descripcion: `Actualizada reseña ${id}`,
      ip_address: ctx.ip_address,
      user_agent: ctx.user_agent,
    });
  }

  return rows[0];
};
