const pool = require("../db/pool");
const AppError = require("../utils/AppError");

exports.listCorredores = async () => {

  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      c.id AS corredor_id,
      c.licencia_nro,
      c.telefono,
      c.comision_base,
      u.nombre AS corredor_nombre,
      u.email  AS corredor_email,
      u.active AS active
    FROM corredores c
    JOIN usuarios u
    ON u.id = c.usuario_id
    WHERE u.deleted_at IS NULL
    ORDER BY c.id ASC;
    `
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
    *
    FROM corredores
    WHERE usuario_id = $1 LIMIT 1;
    `,
    [usuario_id]
  );
  if (!rows.length) throw new AppError("El usuario que esta buscando no es corredor", 404);
  return rows[0];
};

exports.updateCorredor = async (usuario_id, data) => {
  const { nombre, telefono, comision_base, licencia_nro } = data;

  const { rows: userRows } = await pool.query(
    `UPDATE usuarios
     SET nombre = COALESCE($2, nombre)
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id;`,
    [usuario_id, nombre]
  );
  if (!userRows.length) throw new AppError("Corredor no encontrado", 404);

  const { rows: corrRows } = await pool.query(
    `UPDATE corredores
     SET telefono = COALESCE($2, telefono),
         comision_base = COALESCE($3, comision_base),
         licencia_nro = COALESCE($4, licencia_nro)
     WHERE usuario_id = $1
     RETURNING *;`,
    [usuario_id, telefono, comision_base, licencia_nro]
  );

  return corrRows[0];
};
