const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/reservas.controller");

// Todas las rutas de reservas requieren autenticación
router.use(auth);

// Listado general adaptado al rol del usuario autenticado
// ?tipo=recibidas | mias (para corredores)
// ?estado=todas | proxima | en_curso | finalizada | cancelada
// ?search=texto
// ?desde=YYYY-MM-DD & hasta=YYYY-MM-DD
router.get("/", asyncHandler(c.listReservas));

// Rutas explícitas por usuario (cliente o corredor)
router.get("/cliente/:id", asyncHandler(c.listReservasDeCliente));
router.get("/corredor/:id", asyncHandler(c.listReservasDeCorredor));

router.post("/:id/autorizar", asyncHandler(c.autorizarReserva));
router.post("/:id/pagar", asyncHandler(c.pagarReserva));
router.post("/:id/cancelar", asyncHandler(async (req, res) => {
  const reservas = require("../services/reservas.service");
  res.json({ ok: true, data: await reservas.cancelarReserva(req.params.id, req.user, req.body || {}) });
}));
router.post("/:id/prolongar", asyncHandler(async (req, res) => {
  const reservas = require("../services/reservas.service");
  res.json({ ok: true, data: await reservas.prolongarReserva(req.params.id, req.user) });
}));
router.post("/:id/calificar", asyncHandler(async (req, res) => {
  const reservas = require("../services/reservas.service");
  res.json({ ok: true, data: await reservas.calificarReserva(req.params.id, req.user, req.body || {}) });
}));
router.get("/:id", asyncHandler(c.getReservaById));

module.exports = router;
