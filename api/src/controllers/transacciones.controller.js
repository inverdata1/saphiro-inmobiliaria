const transaccionesService = require("../services/transacciones.service");
const buildCtx = require("../utils/ctx");

exports.listTransacciones = async (req, res) => {
  const result = await transaccionesService.listTransacciones(req.query);
  res.json({ ok: true, data: result.data, pagination: result.pagination });
};

exports.getTransaccionById = async (req, res) => {
  const data = await transaccionesService.getTransaccionById(Number(req.params.id));
  res.json({ ok: true, data });
};

exports.createTransaccion = async (req, res) => {
  const data = await transaccionesService.createTransaccion(req.body, buildCtx(req));
  res.status(201).json({ ok: true, data });
};

exports.procesarPago = async (req, res) => {
  const data = await transaccionesService.procesarPago(req.body, buildCtx(req));
  res.json(data);
};

exports.crearReserva = async (req, res) => {
  const data = await transaccionesService.crearReserva(req.body, buildCtx(req));
  res.status(201).json({ ok: true, data });
};
