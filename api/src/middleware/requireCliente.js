// Deja pasar solo a usuarios con rol "cliente".
// Se usa en endpoints donde el propio cliente consulta sus datos (p.ej. sus contratos).
module.exports = function requireCliente(req, _res, next) {
  if (!req.user || req.user.rol !== "cliente") {
    const err = new Error("Acceso solo para clientes");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }

  next();
};
