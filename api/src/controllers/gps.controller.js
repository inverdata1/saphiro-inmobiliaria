const gpsService = require("../services/gps.service");

exports.listGps = async (req, res) => {
  const data = await gpsService.listGps(req.query.limit);
  res.json({ ok: true, data });
};
