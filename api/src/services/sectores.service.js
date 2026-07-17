const pool = require("../db/pool");
const AppError = require("../utils/AppError");

exports.listSectores = async (ciudadId) => {
  if (!ciudadId) throw new AppError("ciudad_id requerido", 400);

  const { rows } = await pool.query(
    `SELECT id, nombre, ciudad_id
     FROM sectores
     WHERE ciudad_id = $1
     ORDER BY nombre ASC;`,
    [ciudadId]
  );

  return rows;
};
