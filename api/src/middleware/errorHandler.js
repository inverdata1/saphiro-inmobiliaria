const AppError = require("../utils/AppError");

module.exports = function errorHandler(err, _req, res, _next) {
  if (err && err.code && typeof err.code === "string" && err.code.length === 5) {
    console.error("[PG ERROR DETALLE]", {
      code: err.code,
      message: err.message,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
      where: err.where,
      schema: err.schema,
      table: err.table,
      column: err.column,
      constraint: err.constraint,
      routine: err.routine,
      sql: err.sql,
      stack: err.stack?.split("\n").slice(0, 3).join(" | "),
    });
  } else if (err instanceof AppError && !err.isOperational) {
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

