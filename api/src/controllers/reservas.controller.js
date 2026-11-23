const reservasService = require("../services/reservas.service");
const { resolveUuidToId } = require("../middleware/publicId");

exports.listReservas = async (req, res, next) => {
  try {
    const data = await reservasService.listReservas(req.user, req.query);
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.listReservasDeCliente = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await reservasService.listReservasDeCliente(id, req.query);
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.listReservasDeCorredor = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await reservasService.listReservasDeCorredor(id, req.query);
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.getReservaById = async (req, res, next) => {
  try {
    const data = await reservasService.getReservaById(req.params.id, req.user);
    res.status(200).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};
