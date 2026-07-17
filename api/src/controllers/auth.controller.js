const authService = require("../services/auth.service");
const buildCtx = require("../utils/ctx");

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
  const { email, porcentaje } = req.body;
  await authService.registerCorredor({ email, porcentaje }, buildCtx(req));
  res.status(201).json({ ok: true, message: "Corredor registrado" });
}

exports.reinvitarCorredor = async (req, res) => {
  const data = await authService.reinvitarCorredor(req.body);
  res.json({ ok: true, data });
};

exports.login = async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ ok: true, data });
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
