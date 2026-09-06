const costosService = require("../services/costosAdicionales.service");

exports.list = async (_req, res) => {
  const data = await costosService.list();
  res.json({ ok: true, data });
};
