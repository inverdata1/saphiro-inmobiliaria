const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/guardados.controller");

router.post("/", auth, asyncHandler(c.saveInmueble));
router.get("/", asyncHandler(c.listGuardados));
router.get("/:usuario_id", asyncHandler(c.listGuardadosByUsuario));
router.get("/:usuario_id/:inmueble_id", asyncHandler(c.getGuardado));
router.delete("/:usuario_id/:inmueble_id", auth, asyncHandler(c.deleteGuardado));

module.exports = router;