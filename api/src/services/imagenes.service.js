const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

exports.getUploadsDir = () => UPLOADS_DIR;

exports.getImagesByInmuebleId = async (inmuebleId) => {
  const { rows } = await pool.query(
    "SELECT id, inmueble_id, url, orden, portada FROM imagenes WHERE inmueble_id = $1 ORDER BY orden ASC",
    [inmuebleId]
  );
  return rows;
};

exports.createImages = async (inmuebleId, files) => {
  const existing = await pool.query(
    "SELECT COALESCE(MAX(orden), 0) AS max_orden FROM imagenes WHERE inmueble_id = $1",
    [inmuebleId]
  );
  let nextOrden = existing.rows[0].max_orden + 1;

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const orden = nextOrden + i;
    const portada = i === 0 && nextOrden === 1;

    const { rows } = await pool.query(
      `INSERT INTO imagenes (inmueble_id, url, orden, portada, ruta_s3)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, inmueble_id, url, orden, portada`,
      [inmuebleId, "/uploads/" + files[i].filename, orden, portada, "/uploads/" + files[i].filename]
    );

    const imgId = rows[0].id;
    const url = `/imagenes/file/${imgId}`;

    await pool.query(`UPDATE imagenes SET url = $1 WHERE id = $2;`, [url, imgId]);

    results.push({ ...rows[0], url });
  }
  return results;
};

exports.deleteImage = async (id) => {
  const { rows } = await pool.query(
    "DELETE FROM imagenes WHERE id = $1 RETURNING id, url",
    [id]
  );
  if (!rows.length) throw new AppError("Imagen no encontrada", 404);
  return rows[0];
};

exports.getImageById = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, inmueble_id, url, orden, portada, ruta_s3 FROM imagenes WHERE id = $1",
    [id]
  );
  if (!rows.length) throw new AppError("Imagen no encontrada", 404);
  return rows[0];
};
