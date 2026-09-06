const AppError = require("../utils/AppError");
const pool = require("../db/pool");

async function requireEmailVerified(req, res, next) {
  if (!req.user?.id) {
    return next(new AppError("No autorizado", 401));
  }

  const { rows } = await pool.query(
    "SELECT email_verified FROM usuarios WHERE id = $1 LIMIT 1;",
    [req.user.id]
  );

  if (!rows.length) {
    return next(new AppError("Usuario no encontrado", 404));
  }

  if (!rows[0].email_verified) {
    const err = new AppError("Correo no verificado. Verifica tu correo para realizar esta acción.", 403);
    err.code = "EMAIL_NOT_VERIFIED";
    return next(err);
  }

  next();
}

module.exports = requireEmailVerified;
