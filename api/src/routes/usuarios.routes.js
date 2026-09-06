const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/usuarios.controller");

router.get("/", auth, admin, asyncHandler(c.listUsuarios));
router.get("/clientes", auth, asyncHandler(c.listClientes));

router.patch("/me", auth, asyncHandler(c.patchUsuarioNormal));
router.get("/:id", auth, asyncHandler(c.getUsuarioById));
router.patch("/:id", auth, admin, asyncHandler(c.patchUsuario));
router.delete("/:id", auth, admin, asyncHandler(c.deleteUsuario));

module.exports = router;
