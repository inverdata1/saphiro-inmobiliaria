const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const c = require("../controllers/corredores.controller");

router.get("/", auth, asyncHandler(c.listCorredores));
router.get("/:usuario_id", auth, asyncHandler(c.getCorredorByUserId));
router.patch("/:id/toggle-activo", auth, asyncHandler(c.toggleActivo));
router.put("/:id", auth, asyncHandler(c.updateCorredor));
router.delete("/:id", auth, asyncHandler(c.remove));

module.exports = router;