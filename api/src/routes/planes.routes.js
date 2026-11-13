const router = require("express").Router();
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/planes.controller");
const { uploadMedia } = require("../utils/mediaUpload");

router.get("/catalogo", asyncHandler(c.catalogo));
router.get("/portada", asyncHandler(c.portada));
router.get("/vehiculos", asyncHandler(c.vehiculosPublicos));
router.get("/mio", auth, asyncHandler(c.mio));
router.post("/cargos", auth, asyncHandler(c.cobrar));
router.post("/cargos/:id/pagar", auth, asyncHandler(c.pagar));
router.post("/asesores", auth, asyncHandler(c.asesor));
router.post("/vehiculos", auth, asyncHandler(c.vehiculo));
router.post("/soporte", auth, asyncHandler(c.soporte));
router.get("/oficina", auth, requireAdmin, asyncHandler(c.oficina));
router.post("/cargos/:id/entrega", auth, requireAdmin, uploadMedia.array("archivos", 20), asyncHandler(c.entregar));
router.patch("/soporte/:id", auth, requireAdmin, asyncHandler(c.responderSoporte));
router.get("/corredores", auth, requireAdmin, asyncHandler(c.corredores));
router.patch("/corredores/:id", auth, requireAdmin, asyncHandler(c.asignar));
router.post("/destacar", auth, requireAdmin, asyncHandler(c.destacar));
router.post("/repost", auth, requireAdmin, asyncHandler(c.repost));
router.post("/anuncios", auth, requireAdmin, asyncHandler(c.crearAnuncio));
router.delete("/anuncios/:id", auth, requireAdmin, asyncHandler(c.borrarAnuncio));

module.exports = router;
