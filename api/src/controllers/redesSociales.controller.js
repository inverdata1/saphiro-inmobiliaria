const redesSocialesService = require("../services/redesSociales.service");

exports.list = async (_req, res) => {
  const data = await redesSocialesService.list();
  res.json({ ok: true, data });
};