const pool = require("../db/pool");

// Deja pasar solo a usuarios con rol "corredor" que tengan fila en `corredores`.
// Resuelve el id del corredor (corredores.usuario_id = req.user.id) en req.corredorId.
module.exports = async function requireCorredor(req, _res, next) {
  try {
    if (!req.user || req.user.rol !== "corredor") {
      const err = new Error("Acceso solo para corredores");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }

    const { rows } = await pool.query(
      "SELECT id FROM corredores WHERE usuario_id = $1 LIMIT 1",
      [req.user.id]
    );

    if (!rows.length) {
      const err = new Error("Corredor no encontrado");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }

    req.corredorId = rows[0].id;
    next();
  } catch (e) {
    next(e);
  }
};
