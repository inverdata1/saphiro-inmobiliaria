const contratosService = require("../services/contratos.service");
const { resolveUuidToId } = require("../middleware/publicId");

exports.listContratos = async (req, res) => {
  const data = await contratosService.listContratos(req.contratoScope, req.query);
  res.status(200).json({ ok: true, ...data });
};

// Cliente: contratos del cliente indicado (activos por defecto).
exports.listContratosDeCliente = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await contratosService.listContratosDeCliente(id, req.query);
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

// Corredor: contratos sobre los inmuebles del corredor indicado.
exports.listContratosDeCorredor = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "usuarios", "Usuario");
    const data = await contratosService.listContratosDeCorredor(id, req.query);
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.getContratoById = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "contrato", "Contrato");
    const data = await contratosService.getContratoById(req.contratoScope, id);
    res.status(200).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

// Mensualidades de un contrato concreto (?estado=&limit=&offset=).
exports.listMensualidadesDeContrato = async (req, res, next) => {
  try {
    const id = await resolveUuidToId(req.params.id, "contrato", "Contrato");
    const data = await contratosService.listMensualidadesDeContrato(
      req.contratoScope,
      id,
      req.query
    );
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};

// Mensualidades de todos los contratos sobre un inmueble en alquiler.
exports.listMensualidadesDeInmueble = async (req, res, next) => {
  try {
    const inmuebleId = await resolveUuidToId(req.params.inmuebleId, "inmuebles", "Inmueble");
    const data = await contratosService.listMensualidadesDeInmueble(
      req.contratoScope,
      inmuebleId,
      req.query
    );
    res.status(200).json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
};
