const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/usuarios.controller");
const usuariosService = require("../services/usuarios.service");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, usuariosService.getProfileUploadsDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
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

router.get("/", auth, admin, asyncHandler(c.listUsuarios));
router.get("/clientes", auth, asyncHandler(c.listClientes));

router.patch("/me", auth, asyncHandler(c.patchUsuarioNormal));
router.post("/me/imagen-perfil",
  auth,
  upload.single("imagen"),
  asyncHandler(c.subirFotoPerfil)
);
router.delete("/me/imagen-perfil", auth, asyncHandler(c.eliminarFotoPerfil));
router.get("/:id", auth, asyncHandler(c.getUsuarioById));
router.patch("/:id", auth, admin, asyncHandler(c.patchUsuario));
router.delete("/:id", auth, admin, asyncHandler(c.deleteUsuario));

module.exports = router;
