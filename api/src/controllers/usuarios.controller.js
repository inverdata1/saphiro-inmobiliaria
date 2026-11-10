const usuariosService = require("../services/usuarios.service");
const buildCtx = require("../utils/ctx");
const { resolveUuidToId, esUuid } = require("../middleware/publicId");
const AppError = require("../utils/AppError");

exports.listClientes = async (req, res) => {
  const data = await usuariosService.listClientes(req.query);
  res.json({ ok: true, data });
};

exports.listUsuarios = async (req, res) => {
  const data = await usuariosService.listUsuarios(req.query);
  res.json({ ok: true, data });
};

exports.getUsuarioById = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await usuariosService.getUsuarioById(Number(id));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.patchUsuarioNormal = async (req, res) => {
  const data = await usuariosService.patchUsuarioNormal(req.user.id, req.body, buildCtx(req));
  res.json({ ok: true, data });
};

exports.subirFotoPerfil = async (req, res) => {
  const data = await usuariosService.subirFotoPerfil(req.user.id, req.file, buildCtx(req));
  res.status(201).json({ ok: true, data });
};

exports.eliminarFotoPerfil = async (req, res) => {
  const data = await usuariosService.eliminarFotoPerfil(req.user.id, buildCtx(req));
  res.json({ ok: true, data });
};

exports.patchUsuario = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await usuariosService.patchUsuario(Number(id), req.body, buildCtx(req));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteUsuario = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await usuariosService.deleteUsuario(Number(id), buildCtx(req));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};
