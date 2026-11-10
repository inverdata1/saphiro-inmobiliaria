const transaccionesService = require("../services/transacciones.service");
const buildCtx = require("../utils/ctx");
const { resolveUuidToId } = require("../middleware/publicId");

exports.listTransacciones = async (req, res) => {
  const result = await transaccionesService.listTransacciones(req.query);
  res.json({ ok: true, data: result.data, pagination: result.pagination });
};

exports.listTransferenciasRecibidas = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    const result = await transaccionesService.listTransferenciasRecibidas(
      usuarioId,
      req.query
    );
    res.json({ ok: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

exports.listTransferenciasRealizadas = async (req, res, next) => {
  try {
    const usuarioId = await resolveUuidToId(req.params.usuario_id, "usuarios", "Usuario");
    const result = await transaccionesService.listTransferenciasRealizadas(
      usuarioId,
      req.query
    );
    res.json({ ok: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
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

// Pago de una cuota de alquiler fijo. El arrendatario sale del JWT (buildCtx), no del body.
exports.pagarMensualidad = async (req, res) => {
  const data = await transaccionesService.pagarMensualidad(req.body, buildCtx(req));
  res.status(201).json(data);
};

exports.crearReserva = async (req, res) => {
  const data = await transaccionesService.crearReserva(req.body, buildCtx(req));
  res.status(201).json({ ok: true, data });
};
