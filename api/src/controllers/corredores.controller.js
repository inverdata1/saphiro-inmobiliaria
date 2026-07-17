const corredoresService = require("../services/corredores.service");

exports.listCorredores = async (req, res) => {
  const data = await corredoresService.listCorredores(req.query.q);
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
