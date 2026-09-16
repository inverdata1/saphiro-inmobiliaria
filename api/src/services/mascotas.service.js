const pool = require("../db/pool");

exports.listMascotas = async () => {
  const { rows } = await pool.query(`SELECT id, nombre FROM mascotas ORDER BY id ASC;`);
  return rows;
};