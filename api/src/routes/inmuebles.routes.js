const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/inmuebles.controller");
const imagenesService = require("../services/imagenes.service");

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
router.get("/disponibles", asyncHandler(c.listDisponiblesPorCiudad));
router.get("/disponibles-por-estado", asyncHandler(c.listDisponiblesPorEstado));
router.get("/:id", asyncHandler(c.getInmuebleById));
router.post("/", auth, upload.array("imagenes", 20), asyncHandler(c.createInmueble));
router.patch("/:id", auth, asyncHandler(c.patchInmueble));

module.exports = router;