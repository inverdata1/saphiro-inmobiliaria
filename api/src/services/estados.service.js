const pool = require("../db/pool");

exports.listEstados = async () => {
  const { rows } = await pool.query(`SELECT id, nombre FROM estados ORDER BY nombre ASC;`);
  return rows;
};
