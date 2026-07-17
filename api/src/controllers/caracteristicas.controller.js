const caracteristicasService = require("../services/caracteristicas.service");

exports.listCaracteristicas = async (_req, res) => {
  const data = await caracteristicasService.listCaracteristicas();
  res.json({ ok: true, data });
};

exports.listCaracteristicasByInmueble = async (req, res) => {
  const data = await caracteristicasService.listCaracteristicasByInmueble(req.params.inmuebleId);
  res.json({ ok: true, data });
};
