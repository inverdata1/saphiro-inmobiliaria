const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");

exports.listClientes = async (query) => {
  const { q, limit = 100, offset = 0 } = query;

  const conditions = [];
  const values = [];

  if (q) {
    values.push(`%${q}%`);
    conditions.push(`(nombre ILIKE $1 OR email ILIKE $1 OR CAST(id AS TEXT) = $1)`);
  }

  conditions.push(`rol IN ('corredor', 'cliente')`);
  conditions.push(`nombre IS NOT NULL`);
  
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(Math.min(Number(limit) || 100, 500));
  const limitIdx = values.length;
  values.push(Math.max(Number(offset) || 0, 0));
  const offsetIdx = values.length;

  const { rows } = await pool.query(
    `
      SELECT id, nombre, email, fecha_registro
      FROM usuarios
      ${where}
      ORDER BY id DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `,
    values
  );

  return rows;
};

exports.listUsuarios = async (query) => {
  const { q, limit = 100, offset = 0, isAdmin, allUsuarios } = query;

  const conditions = [];
  const values = [];

  if (q) {
    values.push(`%${q}%`);
    conditions.push(`(nombre ILIKE $1 OR email ILIKE $1)`);
  }

  if (isAdmin === "true") {
    conditions.push(`rol = 'admin'`);
  }

  if (allUsuarios !== "true") {
    conditions.push(`nombre IS NOT NULL`);
  }

  conditions.push(`deleted_at IS NULL`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(Math.min(Number(limit) || 100, 500));
  const limitIdx = values.length;
  values.push(Math.max(Number(offset) || 0, 0));
  const offsetIdx = values.length;

  const { rows } = await pool.query(
    `
      SELECT id, nombre, email, fecha_registro
      FROM usuarios
      ${where}
      ORDER BY id DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `,
    values
  );

  return rows;
};


exports.getUsuarioById = async (id) => {
  if (!Number.isInteger(id) || id <= 0) throw new AppError("id inválido", 400);

  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, fecha_registro FROM usuarios WHERE id = $1 LIMIT 1;`,
    [id]
  );

  if (!rows.length) throw new AppError("Usuario no existe", 404);
  return rows[0];
};

exports.deleteUsuario = async (id, ctx) => {
  if (!Number.isInteger(id) || id <= 0) throw new AppError("id inválido", 400);

  const client = await pool.connect();
  let usuario;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE usuarios
       SET deleted_at = NOW()
       WHERE id = $1
         AND deleted_at IS NULL
       RETURNING id;`,
      [id]
    );

    if (!rows.length) throw new AppError("Usuario no encontrado", 404);

    if (ctx) {
      await auditoriaService.registrarDelete({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "usuarios",
        descripcion: `Eliminado usuario ${id}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    usuario = rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return usuario;
};

exports.patchUsuarioNormal = async (userId, body, ctx) => {
  if (!Number.isInteger(userId) || userId <= 0) throw new AppError("id inválido", 400);

  const nombre = (body?.nombre || "").trim();
  if (!nombre) throw new AppError("nombre es requerido", 400);

  const client = await pool.connect();
  let usuario;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE usuarios
       SET nombre = $1
       WHERE id = $2
       RETURNING id, nombre, email, rol, fecha_registro, email_verified;
       `,
      [nombre, userId]
    );

    if (!rows.length) throw new AppError("Usuario no existe", 404);

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "usuarios",
        descripcion: `Actualizado nombre propio del usuario ${userId}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    usuario = rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return usuario;
};

exports.patchUsuario = async (id, body, ctx) => {

  const allowed = new Set(["nombre", "email", "telefono", "estatus"]);
  const keys = Object.keys(body || {}).filter((k) => allowed.has(k));

  if (!keys.length) throw new AppError("No hay campos válidos para actualizar", 400);

  const set = [];
  const values = [];

  keys.forEach((k) => {
    values.push(body[k] === "" ? null : body[k]);
    set.push(`${k} = $${values.length}`);
  });

  values.push(id);

  const sql = `
    UPDATE usuarios
    SET ${set.join(", ")}
    WHERE id = $${values.length}
    RETURNING id, nombre, email, estatus, fecha_registro;
  `;

  const client = await pool.connect();
  let usuario;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(sql, values);
    if (!rows.length) throw new AppError("Usuario no existe", 404);

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "usuarios",
        descripcion: `Actualizado usuario ${id}: ${keys.join(", ")}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    usuario = rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return usuario;
};
