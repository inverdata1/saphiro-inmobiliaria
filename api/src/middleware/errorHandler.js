const AppError = require("../utils/AppError");

module.exports = function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError && !err.isOperational) {
    console.error("ERROR inesperado:", err);
  }

  const status = err.statusCode || 500;
  const code = err.code || (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");

  const body = {
    ok: false,
    error: code,
    message: err.message || "Error interno",
  };

  if (err.detail) body.detail = err.detail;

  console.log(body);
  res.status(status).json(body);
};

