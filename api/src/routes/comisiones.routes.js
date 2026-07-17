const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { listComisiones, getComisionById, updateEstatusPago } = require("../controllers/comisiones.controller");

router.get("/", asyncHandler(listComisiones));
router.get("/:id", asyncHandler(getComisionById));
router.patch("/:id/estatus-pago", auth, asyncHandler(updateEstatusPago));

module.exports = router;
