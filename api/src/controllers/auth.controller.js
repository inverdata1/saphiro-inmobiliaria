const authService = require("../services/auth.service");
const buildCtx = require("../utils/ctx");

const isProd = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 15 * 60 * 1000, // 15 minutos
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/auth/refresh", // Solo se envía al endpoint de refresh
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

exports.register = async (req, res) => {
  const data = await authService.register(req.body, buildCtx(req));
  res.status(201).json({ ok: true, data });
};

exports.invitarAdmin = async (req, res) => {
  await authService.invitarAdmin(req.body, buildCtx(req));
  res.status(201).json({ ok: true, message: "Invitación enviada" });
};

exports.reinvitarAdmin = async (req, res) => {
  const data = await authService.reinvitarAdmin(req.body);
  res.json({ ok: true, data });
};

exports.completarRegistroAdmin = async (req, res) => {
  const data = await authService.completarRegistroAdmin(req.body, buildCtx(req));
  res.json({ ok: true, data });
};

exports.registerCorredor = async (req, res) => {
  await authService.registerCorredor(req.body, buildCtx(req));
  res.status(201).json({ ok: true, message: "Corredor registrado" });
}

exports.reinvitarCorredor = async (req, res) => {
  const data = await authService.reinvitarCorredor(req.body);
  res.json({ ok: true, data });
};

exports.login = async (req, res) => {
  const data = await authService.login(req.body);
  res.cookie("access_token", data.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", data.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ ok: true, data: { user: data.user } });
};

exports.refresh = async (req, res) => {
  const oldRefreshToken = req.cookies?.refresh_token;
  if (!oldRefreshToken) {
    const err = new Error("No autorizado");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const data = await authService.rotateRefreshToken(oldRefreshToken);
  res.cookie("access_token", data.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", data.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ ok: true, data: { user: data.user } });
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) await authService.revokeRefreshToken(refreshToken);
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/auth/refresh" });
  res.json({ ok: true, message: "Sesión cerrada" });
};

exports.me = async (req, res) => {
  const user = await authService.me(req.user?.id);
  res.json({ ok: true, data: user });
};

exports.validarTokenRegistro = async (req, res) => {
  const data = await authService.validarTokenRegistro(req.params.token, req.params.rol);
  res.json({ ok: true, data });
};

exports.completarRegistro = async (req, res) => {
  const data = await authService.completarRegistro(req.body, buildCtx(req));
  res.json({ ok: true, data });
};

exports.solicitarReset = async (req, res) => {
  const data = await authService.solicitarReset(req.body);
  res.json({ ok: true, data });
};

exports.verificarCodigoReset = async (req, res) => {
  const data = await authService.verificarCodigoReset(req.body);
  res.json({ ok: true, data });
};

exports.resetPassword = async (req, res) => {
  const data = await authService.resetPassword(req.body, buildCtx(req));
  res.json({ ok: true, data });
};

exports.verificarEmail = async (req, res) => {
  const data = await authService.verificarEmail(req.body);
  res.cookie("access_token", data.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", data.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ ok: true, data: { message: data.message, user: data.user } });
};

exports.reenviarVerificacion = async (req, res) => {
  const data = await authService.reenviarVerificacion(req.body);
  res.json({ ok: true, data });
};
