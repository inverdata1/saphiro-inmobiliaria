const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/tiposInmuebles.controller");

router.get("/", asyncHandler(c.listTipos));

module.exports = router;