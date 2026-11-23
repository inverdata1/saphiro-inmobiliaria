const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const asyncHandler = require("../middleware/asyncHandler");
const requireEmailVerified = require("../middleware/requireEmailVerified");
const c = require("../controllers/inmuebles.controller");
const imagenesService = require("../services/imagenes.service");
const pool = require("../db/pool");
const notificacionesService = require("../services/notificaciones.service");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagenesService.getUploadsDir()),
  filename: (_req, file, cb) => {
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp|avif|gif|bmp)$/i.test(path.extname(file.originalname)))
      return cb(null, true);
    cb(new Error("Solo se permiten imágenes (jpg, png, webp, avif, gif, bmp)"));
  },
});

router.get("/", asyncHandler(c.listInmuebles));
router.get("/corredor/:usuario_id", auth, asyncHandler(c.listMisInmuebles));
router.get("/disponibles", asyncHandler(c.listDisponiblesPorCiudad));
router.get("/disponibles-por-estado", asyncHandler(c.listDisponiblesPorEstado));
router.get("/consulta-alquileres", auth, requireAdmin, asyncHandler(c.consultaAlquileres));
router.get("/:id/reservas", asyncHandler(c.listReservas));
router.get("/:id", asyncHandler(c.getInmuebleById));
router.post("/", auth, requireEmailVerified, upload.array("imagenes", 20), asyncHandler(c.createInmueble));
router.patch("/:id", auth, requireEmailVerified, asyncHandler(c.patchInmueble));
router.put("/:id", auth, requireEmailVerified, upload.array("imagenes", 20), asyncHandler(c.updateInmueble));
router.delete("/:id", auth, requireEmailVerified, asyncHandler(c.deleteInmueble));

router.post("/:id/cita", auth, requireEmailVerified, asyncHandler(async (req, res) => {
  const { resolveUuidToId } = require("../middleware/publicId");
  const citasService = require("../services/citas.service");
  const id = await resolveUuidToId(req.params.id, "inmuebles", "Inmueble");
  const data = await citasService.solicitar(id, req.user);
  res.status(201).json({ ok: true, data });
}));

module.exports = router;