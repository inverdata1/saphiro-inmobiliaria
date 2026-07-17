const pool = require("../db/pool");
const AppError = require("../utils/AppError");

exports.listCiudades = async (estadoId) => {
  if (!estadoId) throw new AppError("estado_id requerido", 400);

  const { rows } = await pool.query(
    `SELECT id, nombre, estado_id
     FROM ciudades
     WHERE estado_id = $1
     ORDER BY nombre ASC;`,
    [estadoId]
  );

  return rows;
};
