const AppError = require("../utils/AppError");
const geocodingService = require("../services/geocoding.service");

exports.forwardGeocode = async (req, res) => {
  const { direccion, ciudad, estado, pais, limit } = req.query;

  if (!direccion || !String(direccion).trim() || String(direccion).trim().length < 4) {
    throw new AppError("La dirección debe tener al menos 4 caracteres", 400);
  }

  const n = limit === undefined ? 5 : Math.min(Math.max(Number(limit), 1), 10);
  const data = await geocodingService.forwardGeocode({
    direccion,
    ciudad,
    estado,
    pais,
    limit: n,
  });

  res.json({ ok: true, data });
};

exports.reverseGeocode = async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new AppError("lat inválida (debe ser número entre -90 y 90)", 400);
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new AppError("lng inválida (debe ser número entre -180 y 180)", 400);
  }

  const data = await geocodingService.reverseGeocode({ lat, lng });
  res.json({ ok: true, data });
};