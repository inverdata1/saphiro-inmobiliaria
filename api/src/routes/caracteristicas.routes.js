const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const resolveUuidParam = require("../middleware/publicId");
const c = require("../controllers/caracteristicas.controller");

router.get("/", asyncHandler(c.listCaracteristicas));
router.get(
  "/inmueble/:inmuebleId",
  resolveUuidParam("inmuebleId", "inmuebles", "Inmueble"),
  asyncHandler(c.listCaracteristicasByInmueble),
);

module.exports = router;
