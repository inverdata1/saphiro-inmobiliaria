const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/tasasCambio.controller");

router.get("/actual", asyncHandler(c.getLatestTasa));
router.get("/historial", asyncHandler(c.getHistorialTasas));

module.exports = router;
