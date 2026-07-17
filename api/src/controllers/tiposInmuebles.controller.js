const tiposInmueblesService = require("../services/tiposInmuebles.service");

exports.listTipos = async (_req, res) => {
  const data = await tiposInmueblesService.listTipos();
  res.json({ ok: true, data });
};
