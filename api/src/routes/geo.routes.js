const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const geo = require("../controllers/geo.Controller");

router.get("/estados", asyncHandler(geo.listEstados));
router.get("/ciudades", asyncHandler(geo.listCiudades));
router.get("/sectores", asyncHandler(geo.listSectores));

module.exports = router;