const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/mascotas.controller");

router.get("/", asyncHandler(c.listMascotas));

module.exports = router;