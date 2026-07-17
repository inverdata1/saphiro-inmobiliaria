const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/usuarios.controller");

router.get("/", auth, admin, asyncHandler(c.listUsuarios));
router.get("/clientes", auth, asyncHandler(c.listClientes));

router.get("/:id", auth, asyncHandler(c.getUsuarioById));
router.post("/", auth, admin, asyncHandler(c.createUsuario));
router.patch("/:id", auth, admin, asyncHandler(c.patchUsuario));

module.exports = router;
