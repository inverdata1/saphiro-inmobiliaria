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

// Detalle individual de reserva
router.get("/:id", asyncHandler(c.getReservaById));

module.exports = router;
