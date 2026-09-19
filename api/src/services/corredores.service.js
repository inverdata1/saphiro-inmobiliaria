const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");
const { validarTelefono } = require("../utils/phoneFormats.cjs");

exports.listCorredores = async (query) => {
  const { q, limit = 100, offset = 0} = query;
  const values= [];

  const AllCorredores= Boolean(query.allCorredores);

  const conditions = [`u.deleted_at IS NULL`];

  if (q) {
    values.push(`%${q}%`);
    conditions.push(`(nombre ILIKE $1 OR email ILIKE $1)`);
  }

  if(!AllCorredores){
    conditions.push(`u.nombre IS NOT NULL`)
  }

  values.push(Math.min(Number(limit) || 100, 500));
  const limitIdx = values.length;
  values.push(Math.max(Number(offset) || 0, 0));
  const offsetIdx = values.length;

  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      c.id AS corredor_id,
      c.licencia_nro,
      c.comision_base,
      u.nombre AS corredor_nombre,
      u.email  AS corredor_email,
      u.active AS active,
      COALESCE(
        (SELECT ARRAY_AGG(nro_telefono)
         FROM (
           SELECT nro_telefono
           FROM nros_telefono
           WHERE corredor_id = c.id
           ORDER BY id ASC
           LIMIT 3
         ) t),
        ARRAY[]::TEXT[]
      ) AS telefonos
    FROM corredores c
    JOIN usuarios u
    ON u.id = c.usuario_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY c.id ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `,
    values
  );

  console.log(rows);
  
  return rows;
};

exports.toggleActive = async (id) => {
  console.log(id);
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET active = NOT active
     WHERE id = $1
     RETURNING active;`,
    [id]
  );
  if (!rows.length) throw new AppError("Corredor no encontrado", 404);
  return { active: rows[0].active };
};

exports.removeCorredor = async (id) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET deleted_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
     RETURNING id;`,
    [id]
  );
  if (!rows.length) throw new AppError("Corredor no encontrado", 404);
};

exports.getCorredorByUserId = async (usuario_id) => {

  const { rows } = await pool.query(
    `
    SELECT
      c.*,
      COALESCE(
        (SELECT ARRAY_AGG(json_build_object('id', nt.id, 'nro_telefono', nt.nro_telefono, 'codigo_pais', nt.codigo_pais) ORDER BY nt.id ASC)
         FROM nros_telefono nt
         WHERE nt.corredor_id = c.id),
        ARRAY[]::JSON[]
      ) AS telefonos
    FROM corredores c
    WHERE c.usuario_id = $1 LIMIT 1;
    `,
    [usuario_id]
  );
  if (!rows.length) throw new AppError("El usuario que esta buscando no es corredor", 404);
  return rows[0];
};

exports.updateCorredor = async (usuario_id, data) => {
  const { nombre, telefono, comision_base, licencia_nro } = data;

  const client = await pool.connect();
  let corredor;

  try {
    await client.query("BEGIN");

    const { rows: userRows } = await client.query(
      `UPDATE usuarios
       SET nombre = COALESCE($2, nombre)
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id;`,
      [usuario_id, nombre]
    );
    if (!userRows.length) throw new AppError("Corredor no encontrado", 404);

    const { rows: corrRows } = await client.query(
      `UPDATE corredores
       SET telefono = COALESCE($2, telefono),
           comision_base = COALESCE($3, comision_base),
           licencia_nro = COALESCE($4, licencia_nro)
       WHERE usuario_id = $1
       RETURNING *;`,
      [usuario_id, telefono, comision_base, licencia_nro]
    );

    corredor = corrRows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return corredor;
};

// ------------------- Redes sociales del corredor -------------------

const SOCIAL_SELECT = `
  SELECT
    ur.id,
    ur.red_social_id,
    ur.usuario_id,
    ur.url,
    ur.orden,
    ur.is_public,
    rs.nombre,
    rs.base_url,
    rs.name_icon
  FROM usuarios_redes_sociales ur
  JOIN redes_sociales rs ON rs.id = ur.red_social_id
`;

exports.listRedesSociales = async (usuario_id) => {
  const { rows } = await pool.query(
    `${SOCIAL_SELECT}
     WHERE ur.usuario_id = $1
     ORDER BY ur.orden ASC, ur.id ASC;`,
    [usuario_id]
  );
  return rows;
};

exports.addRedSocial = async (usuario_id, data, ctx) => {
  const { red_social_id, url, is_public } = data;
  if (!red_social_id) throw new AppError("Falta red_social_id", 400);
  const link = String(url || "").trim();
  if (!link) throw new AppError("Falta la url de la red social", 400);

  const client = await pool.connect();
  let creada;

  try {
    await client.query("BEGIN");

    const { rows: cat } = await client.query(
      `SELECT id, nombre, base_url FROM redes_sociales WHERE id = $1 AND is_active = true;`,
      [red_social_id]
    );
    if (!cat.length) throw new AppError("La red social no existe o está inactiva", 404);

    const baseUrlNorm = (cat[0].base_url || "").trim().toLowerCase();
    if (!link.toLowerCase().startsWith(baseUrlNorm)) {
      throw new AppError(
        `La url debe ser un link de ${cat[0].nombre} (ej: ${cat[0].base_url}tu-usuario)`,
        400
      );
    }

    const { rows: dup } = await client.query(
      `SELECT id FROM usuarios_redes_sociales WHERE usuario_id = $1 AND red_social_id = $2;`,
      [usuario_id, red_social_id]
    );
    if (dup.length) throw new AppError("Esa red social ya está agregada", 409);

    const { rows: rowOrden } = await client.query(
      `SELECT COALESCE(MAX(orden), 0) + 1 AS next FROM usuarios_redes_sociales WHERE usuario_id = $1;`,
      [usuario_id]
    );
    const orden = Number(rowOrden[0]?.next) || 1;

    const { rows } = await client.query(
      `INSERT INTO usuarios_redes_sociales (red_social_id, usuario_id, url, orden, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, red_social_id, usuario_id, url, orden, is_public;`,
      [red_social_id, usuario_id, link, orden, is_public ?? true]
    );
    creada = rows[0];

    await auditoriaService.registrarInsert({
      ...ctx,
      tabla_afectada: "usuarios_redes_sociales",
      descripcion: `Red social agregada: ${cat[0].nombre}`,
    }, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return creada;
};

exports.updateRedSocial = async (usuario_id, id, data, ctx) => {
  const { url, orden, is_public } = data;
  if (url !== undefined && !String(url).trim()) {
    throw new AppError("La url no puede estar vacía", 400);
  }

  const client = await pool.connect();
  let actualizada;

  try {
    await client.query("BEGIN");

    const { rows: existe } = await client.query(
      `SELECT ur.id, rs.nombre
       FROM usuarios_redes_sociales ur
       JOIN redes_sociales rs ON rs.id = ur.red_social_id
       WHERE ur.id = $1 AND ur.usuario_id = $2;`,
      [id, usuario_id]
    );
    if (!existe.length) throw new AppError("Red social del corredor no encontrada", 404);

    const { rows } = await client.query(
      `UPDATE usuarios_redes_sociales
       SET url = COALESCE($3, url),
           orden = COALESCE($4, orden),
           is_public = COALESCE($5, is_public)
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, red_social_id, usuario_id, url, orden, is_public;`,
      [id, usuario_id, url !== undefined ? String(url).trim() : null, orden ?? null, is_public ?? null]
    );
    actualizada = rows[0];

    await auditoriaService.registrarUpdate({
      ...ctx,
      tabla_afectada: "usuarios_redes_sociales",
      descripcion: `Red social actualizada: ${existe[0].nombre}`,
    }, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return actualizada;
};

exports.deleteRedSocial = async (usuario_id, id, ctx) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: existe } = await client.query(
      `SELECT ur.id, rs.nombre
       FROM usuarios_redes_sociales ur
       JOIN redes_sociales rs ON rs.id = ur.red_social_id
       WHERE ur.id = $1 AND ur.usuario_id = $2;`,
      [id, usuario_id]
    );
    if (!existe.length) throw new AppError("Red social del corredor no encontrada", 404);

    await client.query(
      `DELETE FROM usuarios_redes_sociales WHERE id = $1 AND usuario_id = $2;`,
      [id, usuario_id]
    );

    await auditoriaService.registrarDelete({
      ...ctx,
      tabla_afectada: "usuarios_redes_sociales",
      descripcion: `Red social eliminada: ${existe[0].nombre}`,
    }, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------- Números de teléfono del corredor -------------------

const MAX_TELEFONOS = 3;

exports.listTelefonos = async (usuario_id) => {
  const { rows } = await pool.query(
    `SELECT nt.id, nt.nro_telefono, nt.codigo_pais
     FROM nros_telefono nt
     JOIN corredores c ON c.id = nt.corredor_id
     WHERE c.usuario_id = $1
     ORDER BY nt.id ASC;`,
    [usuario_id]
  );
  return rows;
};

const validarTelefonoBody = (data) => {
  const { iso2, telefono } = data;
  if (!iso2 || !telefono) throw new AppError("iso2 y telefono son requeridos", 400);
  const val = validarTelefono(iso2, telefono);
  if (!val.ok) throw new AppError(val.mensaje, 400);
  return val.normalizado;
};

exports.addTelefono = async (usuario_id, data, ctx) => {
  const normalizado = validarTelefonoBody(data);
  const {iso2} = data;

  const client = await pool.connect();
  let creado;

  try {
    await client.query("BEGIN");

    const { rows: corr } = await client.query(
      `SELECT id FROM corredores WHERE usuario_id = $1 LIMIT 1;`,
      [usuario_id]
    );
    if (!corr.length) throw new AppError("El usuario no es un corredor", 404);
    const corredor_id = corr[0].id;

    const { rows: count } = await client.query(
      `SELECT COUNT(*)::int AS n FROM nros_telefono WHERE corredor_id = $1;`,
      [corredor_id]
    );
    if (Number(count[0]?.n) >= MAX_TELEFONOS) {
      throw new AppError(`El corredor solo puede tener ${MAX_TELEFONOS} números de teléfono`, 400);
    }

    const { rows: dup } = await client.query(
      `      SELECT id FROM nros_telefono WHERE corredor_id = $1 AND nro_telefono = $2 AND codigo_pais = $3;`,
      [corredor_id, normalizado, iso2]
    );

    if (dup.length) throw new AppError("Ese número de teléfono ya está registrado", 409);

    const { rows } = await client.query(
      `INSERT INTO nros_telefono (corredor_id, nro_telefono, codigo_pais)
       VALUES ($1, $2, $3)
       RETURNING id, corredor_id, nro_telefono, codigo_pais;`,
      [corredor_id, normalizado, iso2]
    );
    creado = rows[0];

    await auditoriaService.registrarInsert({
      ...ctx,
      tabla_afectada: "nros_telefono",
      descripcion: `Teléfono agregado: ${normalizado}`,
    }, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return creado;
};

exports.updateTelefono = async (usuario_id, id, data, ctx) => {
  const normalizado = validarTelefonoBody(data);
  const {iso2} = data;
  const client = await pool.connect();
  let actualizado;

  try {
    await client.query("BEGIN");

    const { rows: existe } = await client.query(
      `SELECT nt.id, nt.nro_telefono
       FROM nros_telefono nt
       JOIN corredores c ON c.id = nt.corredor_id
       WHERE nt.id = $1 AND c.usuario_id = $2;`,
      [id, usuario_id]
    );
    
    if (!existe.length) throw new AppError("Número de teléfono del corredor no encontrado", 404);

    if (existe[0].nro_telefono !== normalizado) {
      const { rows: dup } = await client.query(
      `SELECT nt.id FROM nros_telefono nt
       WHERE nt.corredor_id = (SELECT corredor_id FROM nros_telefono WHERE id = $1)
         AND nt.nro_telefono = $2 AND nt.codigo_pais = $3 AND nt.id <> $1;`,
      [id, normalizado, iso2]
      );
      if (dup.length) throw new AppError("Ese número de teléfono ya está registrado", 409);
    }

    const { rows } = await client.query(
      `UPDATE nros_telefono
       SET nro_telefono = $2, codigo_pais = $3
       WHERE id = $1
       RETURNING id, corredor_id, nro_telefono, codigo_pais;`,
      [id, normalizado, iso2]
    );
    if (!rows.length) throw new AppError("Número de teléfono del corredor no encontrado", 404);
    actualizado = rows[0];

    await auditoriaService.registrarUpdate({
      ...ctx,
      tabla_afectada: "nros_telefono",
      descripcion: `Teléfono actualizado: ${existe[0].nro_telefono} → ${normalizado}`,
    }, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return actualizado;
};

exports.deleteTelefono = async (usuario_id, id, ctx) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: existe } = await client.query(
      `SELECT nt.id, nt.nro_telefono
       FROM nros_telefono nt
       JOIN corredores c ON c.id = nt.corredor_id
       WHERE nt.id = $1 AND c.usuario_id = $2;`,
      [id, usuario_id]
    );
    if (!existe.length) throw new AppError("Número de teléfono del corredor no encontrado", 404);

    await client.query(
      `DELETE FROM nros_telefono WHERE id = $1;`,
      [id]
    );

    await auditoriaService.registrarDelete({
      ...ctx,
      tabla_afectada: "nros_telefono",
      descripcion: `Teléfono eliminado: ${existe[0].nro_telefono}`,
    }, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { message: "Número de teléfono eliminado" };
};
