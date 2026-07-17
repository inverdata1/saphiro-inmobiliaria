const pool = require("../db/pool");
const AppError = require("../utils/AppError");

exports.listEstados = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre FROM estados ORDER BY nombre ASC;`
  );
  return rows;
};

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
