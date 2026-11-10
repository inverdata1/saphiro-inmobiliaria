const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const scopeContrato = require("../middleware/scopeContrato");
const requireClienteOCorredor = require("../middleware/requireClienteOCorredor");
const requireCorredor = require("../middleware/requireCorredor");
const c = require("../controllers/contratos.controller");

router.get("/", auth, scopeContrato, asyncHandler(c.listContratos));


router.get("/cliente/:id", auth, requireClienteOCorredor, asyncHandler(c.listContratosDeCliente));


router.get("/corredor/:id", auth, requireCorredor, asyncHandler(c.listContratosDeCorredor));

router.get(
  "/inmueble/:inmuebleId/mensualidades",
  auth,
  scopeContrato,
  asyncHandler(c.listMensualidadesDeInmueble)
);

router.get(
  "/:id/mensualidades",
  auth,
  scopeContrato,
  asyncHandler(c.listMensualidadesDeContrato)
);

// Detalle de un contrato: incluye el arreglo `mensualidades` con sus transacciones.
router.get("/:id", auth, scopeContrato, asyncHandler(c.getContratoById));



module.exports = router;
