const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler= require("../middleware/asyncHandler");
const { withIdempotency } = require("../middleware/idempotency");
const {
  createTransaccion,
  listTransacciones,
  getTransaccionById,
  procesarPago,
  crearReserva,
} = require("../controllers/transacciones.controller");

router.get("/", asyncHandler(listTransacciones));
router.get("/:id", asyncHandler(getTransaccionById));
router.post("/", auth, asyncHandler(createTransaccion));
router.post("/pago", auth, withIdempotency(asyncHandler(procesarPago)));
router.post("/reserva", auth, withIdempotency(asyncHandler(crearReserva)));

module.exports = router;