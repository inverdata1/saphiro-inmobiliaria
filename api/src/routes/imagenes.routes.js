const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/imagenes.controller");
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
    const allowed = /\.(jpg|jpeg|png|webp|avif|gif|bmp)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error("Solo se permiten imágenes (jpg, png, webp, avif, gif, bmp)"));
  },
});

router.get("/:inmueble_id", asyncHandler(c.getImages));
router.get("/file/:id", asyncHandler(c.getImageFile));
router.get("/optimized/:id", asyncHandler(c.getResizedImage));
router.post("/:inmueble_id", auth, upload.array("imagenes", 20), asyncHandler(c.uploadImages));
router.delete("/:id", auth, asyncHandler(c.deleteImage));

module.exports = router;
