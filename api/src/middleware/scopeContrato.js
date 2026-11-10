const pool = require("../db/pool");

// Resuelve a qué contratos puede acceder el usuario autenticado:
//   - cliente  → contrato.usuario_id = req.user.id (los suyos)
//   - corredor → inmuebles.corredor_id = <id del corredor> (contratos de sus inmuebles)
//   - admin/otros → 403
// El resultado queda en req.contratoScope = { tipo: 'cliente'|'corredor', id }.
module.exports = async function scopeContrato(req, _res, next) {
  try {
    const rol = req.user?.rol;

    if (rol === "cliente") {
      req.contratoScope = { tipo: "cliente", id: req.user.id };
      return next();
    }

    if (rol === "corredor") {
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
      req.contratoScope = { tipo: "corredor", id: rows[0].id };
      return next();
    }

    const err = new Error("Acceso solo para clientes y corredores");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    next(err);
  } catch (e) {
    next(e);
  }
};