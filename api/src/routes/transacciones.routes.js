const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler= require("../middleware/asyncHandler");
const { withIdempotency } = require("../middleware/idempotency");
const {
  createTransaccion,
  listTransacciones,
  listTransferenciasRecibidas,
  listTransferenciasRealizadas,
  getTransaccionById,
  procesarPago,
  pagarMensualidad,
  crearReserva,
} = require("../controllers/transacciones.controller");

router.get("/", asyncHandler(listTransacciones));
router.get("/corredor/:usuario_id", auth, asyncHandler(listTransferenciasRecibidas));
router.get("/cliente/:usuario_id", auth, asyncHandler(listTransferenciasRealizadas));
router.get("/:id", asyncHandler(getTransaccionById));
router.post("/", auth, asyncHandler(createTransaccion));
router.post("/pago", auth, withIdempotency(asyncHandler(procesarPago)));
router.post("/pago-mensualidad", auth, withIdempotency(asyncHandler(pagarMensualidad)));
router.post("/reserva", auth, withIdempotency(asyncHandler(crearReserva)));

module.exports = router;