const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const requireEmailVerified = require("../middleware/requireEmailVerified");
const c = require("../controllers/guardados.controller");

router.post("/", auth, requireEmailVerified, asyncHandler(c.saveInmueble));
router.get("/", asyncHandler(c.listGuardados));
router.get("/:usuario_id", asyncHandler(c.listGuardadosByUsuario));
router.get("/:usuario_id/:inmueble_id", asyncHandler(c.getGuardado));
router.delete("/:usuario_id/:inmueble_id", auth, requireEmailVerified, asyncHandler(c.deleteGuardado));

module.exports = router;