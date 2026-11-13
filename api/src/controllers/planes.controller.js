const planes = require("../services/planes.service");
const cobertura = require("../services/cobertura.service");
const AppError = require("../utils/AppError");

exports.catalogo = async (_req, res) => {
  res.json({ ok: true, data: planes.catalogo() });
};

exports.portada = async (_req, res) => {
  res.json({ ok: true, data: await planes.portada() });
};

exports.corredores = async (_req, res) => {
  res.json({ ok: true, data: await planes.listarCorredores() });
};

exports.asignar = async (req, res) => {
  res.json({ ok: true, data: await planes.asignarPlan(req.params.id, req.body || {}) });
};

exports.destacar = async (req, res) => {
  try {
    const data = await cobertura.destacar(req.body?.inmueble_id);
    return res.json({ ok: true, data: { ...data, cobro: "incluido" } });
  } catch (err) {
    if (err.statusCode !== 402) throw err;
    const data = await cobertura.aplicarCobroDeInmueble(req.body?.inmueble_id, "destacado");
    return res.json({ ok: true, data: { ...data, cobro: "pagado", monto: 5 } });
  }
};

exports.repost = async (req, res) => {
  const data = await cobertura.aplicarCobroDeInmueble(req.body?.inmueble_id, "repost");
  res.json({ ok: true, data: { ...data, cobro: "pagado", monto: 2 } });
};

exports.crearAnuncio = async (req, res) => {
  const body = req.body || {};
  if (body.posicion === "lateral") {
    if (!body.corredor_id) throw new AppError("Indica el corredor para cobrar los $15 del banner.", 400);
    const cargo = await cobertura.crearCargo(Number(body.corredor_id), {
      concepto: "banner",
      titulo: body.titulo,
      empresa: body.empresa,
      enlace: body.enlace,
    });
    const pagado = cargo.estatus_pago === "pagado" ? cargo : await cobertura.pagarCargo(cargo.id);
    return res.status(201).json({ ok: true, data: { ...pagado, cobro: "pagado", monto: 15 } });
  }
  res.status(201).json({ ok: true, data: await planes.crearAnuncio(body) });
};

exports.oficina = async (_req, res) => {
  res.json({ ok: true, data: await cobertura.oficina() });
};

exports.entregar = async (req, res) => {
  res.json({ ok: true, data: await cobertura.entregarCargo(req.params.id, req.files || []) });
};

exports.soporte = async (req, res) => {
  const cor = await cobertura.corredorPorUsuario(req.user.id);
  res.status(201).json({ ok: true, data: await cobertura.crearSoporte(cor.id, req.body || {}) });
};

exports.responderSoporte = async (req, res) => {
  res.json({ ok: true, data: await cobertura.responderSoporte(req.params.id, req.body || {}) });
};

exports.borrarAnuncio = async (req, res) => {
  res.json({ ok: true, data: await planes.borrarAnuncio(req.params.id) });
};

async function corredorActivo(req) {
  if (req.user?.rol === "admin" && req.body?.corredor_id) return { id: Number(req.body.corredor_id) };
  return cobertura.corredorPorUsuario(req.user.id);
}

exports.mio = async (req, res) => {
  const cor = await cobertura.corredorPorUsuario(req.user.id);
  const data = await cobertura.resumen(cor.id);
  if (!data.cupo || (data.cupo.plan === "basico" && data.cupo.destacados === 0)) {
    data.reporte = data.cupo.plan === "basico" ? null : data.reporte;
  }
  if (data.cupo.plan === "basico") data.reporte = null;
  res.json({ ok: true, data });
};

exports.cobrar = async (req, res) => {
  const cor = await corredorActivo(req);
  const cargo = await cobertura.crearCargo(cor.id, req.body || {});
  if (req.body?.registrar && req.user.rol === "admin" && cargo.estatus_pago !== "pagado") {
    return res.json({ ok: true, data: await cobertura.pagarCargo(cargo.id) });
  }
  res.status(201).json({ ok: true, data: cargo });
};

exports.pagar = async (req, res) => {
  const owner = req.user?.rol === "admin" ? null : await cobertura.corredorPorUsuario(req.user.id);
  res.json({ ok: true, data: await cobertura.pagarCargo(req.params.id, owner) });
};

exports.asesor = async (req, res) => {
  const cor = await cobertura.corredorPorUsuario(req.user.id);
  res.status(201).json({ ok: true, data: await cobertura.crearAsesor(cor.id, req.body || {}) });
};

exports.vehiculo = async (req, res) => {
  const cor = await cobertura.corredorPorUsuario(req.user.id);
  res.status(201).json({ ok: true, data: await cobertura.crearVehiculo(cor.id, req.body || {}) });
};

exports.vehiculosPublicos = async (req, res) => {
  res.json({ ok: true, data: await cobertura.listarVehiculos(req.query.inmueble_id) });
};
