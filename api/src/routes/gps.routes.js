const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const { listGps } = require("../controllers/gps.controller");

router.get("/", asyncHandler(listGps));

module.exports = router;
