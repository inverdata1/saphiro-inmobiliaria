const pool = require("../db/pool");

exports.list = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre, base_url, name_icon FROM redes_sociales WHERE is_active = true ORDER BY id ASC;`
  );
  return rows;
};