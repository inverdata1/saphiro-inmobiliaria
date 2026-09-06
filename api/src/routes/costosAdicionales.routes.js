const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const c = require("../controllers/costosAdicionales.controller");

router.get("/", auth, asyncHandler(c.list));

module.exports = router;
