// Deja pasar a usuarios con rol "cliente" o "corredor".
// Se usa en los contratos del cliente/inquilino, porque un corredor también
// puede alquilar (figurar como arrendatario) y necesita ver sus contratos.
module.exports = function requireClienteOCorredor(req, _res, next) {
  const rol = req.user?.rol;
  if (rol !== "cliente" && rol !== "corredor") {
    const err = new Error("Acceso solo para clientes y corredores");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }

  next();
};
