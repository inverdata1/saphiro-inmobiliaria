const tasasService = require("../services/tasasCambio.service");

exports.getLatestTasa = async (_req, res) => {
  const tasa = await tasasService.getLatestTasa();
  res.json({ ok: true, data: tasa });
};

exports.getHistorialTasas = async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
  const historial = await tasasService.getAllTasas(limit);
  res.json({ ok: true, data: historial });
};