module.exports = function requireAdmin(req, _res, next) {
  if (!req.user || req.user.rol !== "admin") {
    const err = new Error("Acceso prohibido");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }

  next();
};
