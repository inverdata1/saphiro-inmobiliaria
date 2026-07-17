const ciudadesService = require("../services/ciudades.service");

exports.listCiudades = async (req, res) => {
  const data = await ciudadesService.listCiudades(Number(req.query.estado_id));
  res.json({ ok: true, data });
};
