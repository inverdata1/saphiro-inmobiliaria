const router = require("express").Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const asyncHandler = require("../middleware/asyncHandler");
const citas = require("../services/citas.service");

router.use(auth);

router.get("/pago-movil", asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.pagoMovil() });
}));

router.put("/pago-movil", admin, asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.guardarPagoMovil(req.body || {}) });
}));

router.get("/", asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.listar(req.user) });
}));

router.post("/:id/aceptar", asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.aceptar(req.params.id, req.user) });
}));

router.post("/:id/rechazar", asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.rechazar(req.params.id, req.user) });
}));

router.post("/:id/programar", asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.programar(req.params.id, req.user, req.body || {}) });
}));

router.post("/:id/confirmar", asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await citas.confirmar(req.params.id, req.user) });
}));

module.exports = router;
