const pool = require("../db/pool");

exports.listGps = async (limit = 50) => {
  const lim = Math.min(Number(limit), 200);

  const sql = `
    SELECT g.*, i.titulo AS inmueble_titulo
    FROM ubicaciones_gps g
    LEFT JOIN inmuebles i ON i.id = g.inmueble_id
    ORDER BY g.id DESC
    LIMIT $1;
  `;

  const { rows } = await pool.query(sql, [lim]);
  return rows;
};
