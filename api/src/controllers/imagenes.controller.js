const imagenesService = require("../services/imagenes.service");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

const CACHE_DIR = path.join(__dirname, "..", "..", "cache");

exports.getImages = async (req, res) => {
  const data = await imagenesService.getImagesByInmuebleId(Number(req.params.inmueble_id));
  res.json({ ok: true, data });
};

exports.uploadImages = async (req, res) => {
  const inmuebleId = Number(req.params.inmueble_id);
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ ok: false, message: "No se enviaron imágenes" });

  const data = await imagenesService.createImages(inmuebleId, files);
  res.status(201).json({ ok: true, data });
};

exports.deleteImage = async (req, res) => {
  const data = await imagenesService.deleteImage(Number(req.params.id));
  res.json({ ok: true, data });
};

exports.getImageFile = async (req, res) => {
  const img = await imagenesService.getImageById(Number(req.params.id));
  const filePath = path.join(imagenesService.getUploadsDir(), path.basename(img.ruta_s3));
  res.sendFile(filePath);
};

exports.getResizedImage = async (req, res) => {
  const img = await imagenesService.getImageById(Number(req.params.id));
  const filePath = path.join(imagenesService.getUploadsDir(), path.basename(img.ruta_s3));

  const w = Math.min(Math.max(parseInt(req.query.w) || 800, 100), 2000);
  const q = Math.min(Math.max(parseInt(req.query.q) || 80, 10), 100);

  if (!fs.existsSync(filePath)) {
    return res.sendFile(path.join(imagenesService.getUploadsDir(), "placeholder.jpg")).catch(() => {
      res.status(404).json({ ok: false, message: "Imagen no encontrada" });
    });
  }

  try {
    const cacheKey = `${img.id}_${w}_${q}`;
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.webp`);

    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    if (!fs.existsSync(cachePath)) {
      await sharp(filePath)
        .resize(w, null, { withoutEnlargement: true })
        .webp({ quality: q })
        .toFile(cachePath);
    }

    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    res.setHeader("Content-Type", "image/webp");
    res.sendFile(cachePath);
  } catch (err) {
    res.sendFile(filePath);
  }
};
