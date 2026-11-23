const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/caracteristicas.controller");

router.get("/", asyncHandler(c.listCaracteristicas));
router.get("/inmueble/:inmuebleId", asyncHandler(c.listCaracteristicasByInmueble));

module.exports = router;
