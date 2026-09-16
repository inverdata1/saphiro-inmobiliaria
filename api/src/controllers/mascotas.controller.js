const mascotasService = require("../services/mascotas.service");

exports.listMascotas = async (_req, res) => {
  const data = await mascotasService.listMascotas();
  res.json({ ok: true, data });
};