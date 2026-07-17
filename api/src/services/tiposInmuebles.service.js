const pool = require("../db/pool");

exports.listTipos = async () => {
  const { rows } = await pool.query(`SELECT id, nombre FROM tipos_inmueble ORDER BY nombre ASC;`);
  return rows;
};
