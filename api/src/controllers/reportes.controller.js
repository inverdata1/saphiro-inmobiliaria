const reportesService = require("../services/reportes.service");
const { generarPDF } = require("../utils/reportePdf");

// ---------------------------------------------------------------------------
// Descarga como archivo: ?format=pdf en cualquier reporte.
// Sin `format` (o format=json) → JSON de siempre.
// ---------------------------------------------------------------------------

// Nombre de archivo seguro: sin caracteres raros, con la fecha del filtro.
function nombreArchivo(tipo, meta = {}) {
  const sufijo = meta.desde || meta.hasta ? `_${meta.desde || "inicio"}_${meta.hasta || "hoy"}` : "";
  return `reporte_${tipo}${sufijo}.pdf`;
}

// Responde JSON o PDF según ?format=. `tipo` se usa para el nombre del archivo.
async function responder(req, res, tipo, { data, meta } = {}) {
  const formato = String(req.query.format || "json").toLowerCase();

  if (formato === "pdf") {
    const buffer = await generarPDF(tipo, { data: data || [], meta });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo(tipo, meta)}"`);
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  }

  return res.json({ ok: true, data, meta });
}

exports.getResumen = async (req, res) => {
  const data = await reportesService.getResumen(req.query);
  return responder(req, res, "resumen", { data, meta: data?.filtros });
};

exports.getTopCorredores = async (req, res) => {
  const result = await reportesService.getTopCorredores(req.query);
  return responder(req, res, "top-corredores", result);
};

exports.getPorTipoOperacion = async (req, res) => {
  const result = await reportesService.getPorTipoOperacion(req.query);
  return responder(req, res, "por-tipo", result);
};

exports.getEstatusPago = async (req, res) => {
  const result = await reportesService.getEstatusPago(req.query);
  return responder(req, res, "estatus-pago", result);
};

exports.listTransacciones = async (req, res) => {
  const data = await reportesService.listTransacciones(req.query);
  return responder(req, res, "transacciones", { data, meta: req.query });
};

exports.getVentas = async (req, res) => {
  const result = await reportesService.getVentas(req.query, req.corredorId);
  return responder(req, res, "ventas", result);
};

exports.getAlquileres = async (req, res) => {
  const result = await reportesService.getAlquileres(req.query, req.corredorId);
  return responder(req, res, "alquileres", result);
};

exports.getDisponibilidadPropiedades = async (req, res) => {
  const result = await reportesService.getDisponibilidadPropiedades(req.query, req.corredorId);
  return responder(req, res, "disponibilidad-propiedades", result);
};

exports.getIngresos = async (req, res) => {
  const result = await reportesService.getIngresos(req.query, req.corredorId);
  return responder(req, res, "ingresos", result);
};

exports.getClientes = async (req, res) => {
  const result = await reportesService.getClientes(req.query, req.corredorId);
  return responder(req, res, "clientes", result);
};
