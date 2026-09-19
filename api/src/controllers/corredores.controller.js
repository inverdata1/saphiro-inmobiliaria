const corredoresService = require("../services/corredores.service");
const buildCtx = require("../utils/ctx");

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

exports.toggleActivo = async (req, res) => {
  const data = await corredoresService.toggleActive(req.params.id);
  res.json({ ok: true, data });
};

exports.remove = async (req, res) => {
  await corredoresService.removeCorredor(req.params.id);
  res.json({ ok: true, message: "Corredor eliminado" });
};

exports.getCorredorByUserId = async (req, res) => {
  const data = await corredoresService.getCorredorByUserId(req.params.usuario_id);
  res.json({ ok: true, data });
};

exports.updateCorredor = async (req, res) => {
  const data = await corredoresService.updateCorredor(req.params.id, req.body);
  res.json({ ok: true, data });
};

// ------------------- Redes sociales del corredor -------------------

exports.listRedesSociales = async (req, res) => {
  const data = await corredoresService.listRedesSociales(Number(req.params.usuario_id));
  res.json({ ok: true, data });
};

exports.addRedSocial = async (req, res) => {
  asegurarAcceso(req, req.params.usuario_id);
  const data = await corredoresService.addRedSocial(
    Number(req.params.usuario_id),
    req.body,
    buildCtx(req)
  );
  res.status(201).json({ ok: true, data });
};

exports.updateRedSocial = async (req, res) => {
  asegurarAcceso(req, req.params.usuario_id);
  const data = await corredoresService.updateRedSocial(
    Number(req.params.usuario_id),
    Number(req.params.id),
    req.body,
    buildCtx(req)
  );
  res.json({ ok: true, data });
};

exports.deleteRedSocial = async (req, res) => {
  asegurarAcceso(req, req.params.usuario_id);
  await corredoresService.deleteRedSocial(
    Number(req.params.usuario_id),
    Number(req.params.id),
    buildCtx(req)
  );
  res.json({ ok: true, message: "Red social eliminada" });
};

// ------------------- Números de teléfono del corredor -------------------

exports.listTelefonos = async (req, res) => {
  const data = await corredoresService.listTelefonos(Number(req.params.usuario_id));
  res.json({ ok: true, data });
};

exports.addTelefono = async (req, res) => {
  asegurarAccesoTelefono(req, req.params.usuario_id);
  const data = await corredoresService.addTelefono(
    Number(req.params.usuario_id),
    req.body,
    buildCtx(req)
  );
  res.status(201).json({ ok: true, data });
};

exports.updateTelefono = async (req, res) => {
  asegurarAccesoTelefono(req, req.params.usuario_id);
  const data = await corredoresService.updateTelefono(
    Number(req.params.usuario_id),
    Number(req.params.id),
    req.body,
    buildCtx(req)
  );
  res.json({ ok: true, data });
};

exports.deleteTelefono = async (req, res) => {
  asegurarAccesoTelefono(req, req.params.usuario_id);
  await corredoresService.deleteTelefono(
    Number(req.params.usuario_id),
    Number(req.params.id),
    buildCtx(req)
  );
  res.json({ ok: true, message: "Número de teléfono eliminado" });
};
