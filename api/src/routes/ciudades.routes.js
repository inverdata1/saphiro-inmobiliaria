const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/ciudades.controller");

router.get("/", asyncHandler(c.listCiudades));

module.exports = router;
