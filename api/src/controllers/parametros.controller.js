const parametrosService = require("../services/parametros.service");

exports.get = async (_req, res) => {
  res.json({ ok: true, data: await parametrosService.getParametros() });
};

exports.update = async (req, res) => {
  res.json({ ok: true, data: await parametrosService.updateParametros(req.body || {}) });
};
