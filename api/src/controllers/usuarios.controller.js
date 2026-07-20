const usuariosService = require("../services/usuarios.service");
const buildCtx = require("../utils/ctx");

exports.listClientes = async (req, res) => {
  const data = await usuariosService.listClientes(req.query);
  res.json({ ok: true, data });
};

exports.listUsuarios = async (req, res) => {
  const data = await usuariosService.listUsuarios(req.query);
  res.json({ ok: true, data });
};

exports.getUsuarioById = async (req, res) => {
  const data = await usuariosService.getUsuarioById(Number(req.params.id));
  res.json({ ok: true, data });
};

exports.createUsuario = async (req, res) => {
  const data = await usuariosService.createUsuario(req.body, buildCtx(req));
  res.status(201).json({ ok: true, data });
};

exports.patchUsuario = async (req, res) => {
  const data = await usuariosService.patchUsuario(Number(req.params.id), req.body, buildCtx(req));
  res.json({ ok: true, data });
};

exports.deleteUsuario = async (req, res) => {
  const data = await usuariosService.deleteUsuario(Number(req.params.id), buildCtx(req));
  res.json({ ok: true, data });
};
