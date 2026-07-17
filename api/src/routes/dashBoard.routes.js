const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const {
  getKpis,
  getSerie,
  getTopCorredores,
  getPorTipoOperacion,
  getEstatusPago,
  getDashboardCorredor,
} = require("../controllers/dashBoard.controller");

router.get("/kpis", asyncHandler(getKpis));
router.get("/serie", asyncHandler(getSerie));
router.get("/top-corredores", asyncHandler(getTopCorredores));
router.get("/por-tipo", asyncHandler(getPorTipoOperacion));
router.get("/estatus-pago", asyncHandler(getEstatusPago));
router.get("/corredor/:id", asyncHandler(getDashboardCorredor));

module.exports = router;
