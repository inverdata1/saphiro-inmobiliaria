const corredoresService = require("../services/corredores.service");
const buildCtx = require("../utils/ctx");
const { resolveUuidToId } = require("../middleware/publicId");

const asegurarAcceso = (req, usuario_id) => {
  const uid = Number(usuario_id);
  if (req.user?.rol !== "admin" && Number(req.user?.id) !== uid) {
    const err = new Error("No puedes gestionar las redes sociales de otro usuario");
    err.statusCode = 403;
    throw err;
  }
};

const asegurarAccesoTelefono = (req, usuario_id) => {
  const uid = Number(usuario_id);
  if (req.user?.rol !== "admin" && Number(req.user?.id) !== uid) {
    const err = new Error("No puedes gestionar los teléfonos de otro corredor");
    err.statusCode = 403;
    throw err;
  }
};

exports.listCorredores = async (req, res) => {
  const data = await corredoresService.listCorredores(req.query);
  res.json({ ok: true, data });
};

exports.toggleActivo = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await corredoresService.toggleActive(id);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    await corredoresService.removeCorredor(id);
    res.json({ ok: true, message: "Corredor eliminado" });
  } catch (err) {
    next(err);
  }
};

exports.getCorredorByUserId = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    const data = await corredoresService.getCorredorByUserId(usuarioId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateCorredor = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await corredoresService.updateCorredor(id, req.body);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

// ------------------- Redes sociales del corredor -------------------

exports.listRedesSociales = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    const data = await corredoresService.listRedesSociales(Number(usuarioId));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.addRedSocial = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    asegurarAcceso(req, usuarioId);
    const data = await corredoresService.addRedSocial(
      Number(usuarioId),
      req.body,
      buildCtx(req)
    );
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateRedSocial = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    asegurarAcceso(req, usuarioId);
    const data = await corredoresService.updateRedSocial(
      Number(usuarioId),
      Number(req.params.id),
      req.body,
      buildCtx(req)
    );
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteRedSocial = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    asegurarAcceso(req, usuarioId);
    await corredoresService.deleteRedSocial(
      Number(usuarioId),
      Number(req.params.id),
      buildCtx(req)
    );
    res.json({ ok: true, message: "Red social eliminada" });
  } catch (err) {
    next(err);
  }
};

// ------------------- Nmeros de telfono del corredor -------------------

exports.listTelefonos = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    const data = await corredoresService.listTelefonos(Number(usuarioId));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.addTelefono = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    asegurarAccesoTelefono(req, usuarioId);
    const data = await corredoresService.addTelefono(
      Number(usuarioId),
      req.body,
      buildCtx(req)
    );
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateTelefono = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    asegurarAccesoTelefono(req, usuarioId);
    const data = await corredoresService.updateTelefono(
      Number(usuarioId),
      Number(req.params.id),
      req.body,
      buildCtx(req)
    );
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteTelefono = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    asegurarAccesoTelefono(req, usuarioId);
    await corredoresService.deleteTelefono(
      Number(usuarioId),
      Number(req.params.id),
      buildCtx(req)
    );
    res.json({ ok: true, message: "Nmero de telfono eliminado" });
  } catch (err) {
    next(err);
  }
};
