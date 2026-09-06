const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { ok: false, message: "Demasiados intentos de login, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, message: "Demasiados registros, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { ok: false, message: "Demasiadas solicitudes de recuperación, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});
