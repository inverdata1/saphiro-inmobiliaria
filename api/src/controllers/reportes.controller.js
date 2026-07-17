const reportesService = require("../services/reportes.service");

exports.getResumen = async (req, res) => {
  const data = await reportesService.getResumen(req.query);
  res.json({ ok: true, data });
};

exports.getTopCorredores = async (req, res) => {
  const result = await reportesService.getTopCorredores(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.getPorTipoOperacion = async (req, res) => {
  const result = await reportesService.getPorTipoOperacion(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.getEstatusPago = async (req, res) => {
  const result = await reportesService.getEstatusPago(req.query);
  res.json({ ok: true, data: result.data, meta: result.meta });
};

exports.listTransacciones = async (req, res) => {
  const data = await reportesService.listTransacciones(req.query);
  res.json({ ok: true, data });
};
