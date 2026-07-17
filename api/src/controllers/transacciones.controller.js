const transaccionesService = require("../services/transacciones.service");
const buildCtx = require("../utils/ctx");

exports.listTransacciones = async (req, res) => {
  const data = await transaccionesService.listTransacciones(req.query);
  res.json({ ok: true, data });
};

exports.getTransaccionById = async (req, res) => {
  const data = await transaccionesService.getTransaccionById(Number(req.params.id));
  res.json({ ok: true, data });
};

exports.createTransaccion = async (req, res) => {
  const data = await transaccionesService.createTransaccion(req.body, buildCtx(req));
  res.status(201).json({ ok: true, data });
};
