const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/redesSociales.controller");

router.get("/", asyncHandler(c.list));

module.exports = router;