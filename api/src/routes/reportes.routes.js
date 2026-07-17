const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const {
  getResumen,
  getTopCorredores,
  getPorTipoOperacion,
  getEstatusPago,
  listTransacciones,
} = require("../controllers/reportes.controller");

router.get("/resumen", asyncHandler(getResumen));
router.get("/top-corredores", asyncHandler(getTopCorredores));
router.get("/por-tipo", asyncHandler(getPorTipoOperacion));
router.get("/estatus-pago", asyncHandler(getEstatusPago));
router.get("/transacciones", asyncHandler(listTransacciones));

module.exports = router;
