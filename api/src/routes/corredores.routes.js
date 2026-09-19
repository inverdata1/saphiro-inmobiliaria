const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const c = require("../controllers/corredores.controller");

router.get("/", auth, asyncHandler(c.listCorredores));
router.get("/:usuario_id", auth, asyncHandler(c.getCorredorByUserId));
router.get("/:usuario_id/redes-sociales", asyncHandler(c.listRedesSociales));
router.post("/:usuario_id/redes-sociales", auth, asyncHandler(c.addRedSocial));
router.put("/:usuario_id/redes-sociales/:id", auth, asyncHandler(c.updateRedSocial));
router.delete("/:usuario_id/redes-sociales/:id", auth, asyncHandler(c.deleteRedSocial));
router.get("/:usuario_id/telefonos", asyncHandler(c.listTelefonos));
router.post("/:usuario_id/telefonos", auth, asyncHandler(c.addTelefono));
router.put("/:usuario_id/telefonos/:id", auth, asyncHandler(c.updateTelefono));
router.delete("/:usuario_id/telefonos/:id", auth, asyncHandler(c.deleteTelefono));
router.patch("/:id/toggle-activo", auth, asyncHandler(c.toggleActivo));
router.put("/:id", auth, asyncHandler(c.updateCorredor));
router.delete("/:id", auth, asyncHandler(c.remove));

module.exports = router;