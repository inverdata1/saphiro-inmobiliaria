const pool = require("../db/pool");

exports.listCaracteristicas = async () => {
  const { rows } = await pool.query(`SELECT id, nombre, unidad_medicion FROM caracteristicas ORDER BY id ASC;`);
  return rows;
};

exports.listCaracteristicasByInmueble = async (inmuebleId) => {
  const { rows } = await pool.query(
    `SELECT ci.id, ci.caracteristica_id, c.nombre, c.unidad_medicion, ci.valor
     FROM caracteristica_inmueble ci
     JOIN caracteristicas c ON c.id = ci.caracteristica_id
     WHERE ci.inmueble_id = $1
     ORDER BY c.id ASC;`,
    [inmuebleId]
  );
  return rows;
};
