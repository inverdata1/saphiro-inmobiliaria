const geoService = require("../services/geo.service");

exports.listEstados = async (_req, res) => {
  const data = await geoService.listEstados();
  res.json({ ok: true, data });
};

exports.listCiudades = async (req, res) => {
  const data = await geoService.listCiudades(Number(req.query.estado_id));
  res.json({ ok: true, data });
};

exports.listSectores = async (req, res) => {
  const data = await geoService.listSectores(Number(req.query.ciudad_id));
  res.json({ ok: true, data });
};
