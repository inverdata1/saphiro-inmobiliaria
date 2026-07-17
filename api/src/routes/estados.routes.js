const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/estados.controller");

router.get("/", asyncHandler(c.listEstados));

module.exports = router;
