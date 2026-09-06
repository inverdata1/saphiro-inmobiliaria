const pool = require("../db/pool");

exports.list = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre FROM costos_adicionales ORDER BY id ASC;`
  );
  return rows;
};
