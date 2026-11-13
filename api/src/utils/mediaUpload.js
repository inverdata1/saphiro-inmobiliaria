const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const imagenesService = require("../services/imagenes.service");

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|avif|gif|bmp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

exports.isVideoName = (name) => VIDEO_EXT.test(name || "");
exports.mediaTypeOf = (filename) => (VIDEO_EXT.test(filename || "") ? "video" : "imagen");

exports.uploadMedia = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, imagenesService.getUploadsDir()),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname || "";
    if (IMAGE_EXT.test(name) || VIDEO_EXT.test(name)) return cb(null, true);
    cb(new Error("Solo se permiten imagenes (jpg, png, webp, gif) o videos (mp4, webm, mov)"));
  },
});
