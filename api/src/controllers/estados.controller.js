const estadosService = require("../services/estados.service");

exports.listEstados = async (_req, res) => {
  const data = await estadosService.listEstados();
  res.json({ ok: true, data });
};
