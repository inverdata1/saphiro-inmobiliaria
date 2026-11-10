const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/auth");
const requireCorredor = require("../middleware/requireCorredor");
const {
  getResumen,
  getTopCorredores,
  getPorTipoOperacion,
  getEstatusPago,
  listTransacciones,
  getVentas,
  getAlquileres,
  getDisponibilidadPropiedades,
  getIngresos,
  getClientes,
} = require("../controllers/reportes.controller");

// Reportes generales (sin scope de corredor).
router.get("/resumen", asyncHandler(getResumen));
router.get("/top-corredores", asyncHandler(getTopCorredores));
router.get("/por-tipo", asyncHandler(getPorTipoOperacion));
router.get("/estatus-pago", asyncHandler(getEstatusPago));
router.get("/transacciones", asyncHandler(listTransacciones));

// Reportes por tipo (REPORT_TYPES.value de ReportesPage.jsx).
// Exclusivos de corredores y limitados a sus propios datos.
router.get("/ventas", authenticate, requireCorredor, asyncHandler(getVentas));
router.get("/alquileres", authenticate, requireCorredor, asyncHandler(getAlquileres));
router.get("/disponibilidad-propiedades", authenticate, requireCorredor, asyncHandler(getDisponibilidadPropiedades));
router.get("/ingresos", authenticate, requireCorredor, asyncHandler(getIngresos));
router.get("/clientes", authenticate, requireCorredor, asyncHandler(getClientes));

module.exports = router;
