const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const requireEmailVerified = require("../middleware/requireEmailVerified");
const c = require("../controllers/resenas.controller");

const router = require("express").Router();


router.post("/", auth, requireEmailVerified, asyncHandler(c.createResena));
router.get("/inmueble/:inmueble_id", asyncHandler(c.getResenasByInmuebleId));
router.get("/inmueble/:inmueble_id/usuario/:usuario_id", asyncHandler(c.getResenaByInmuebleAndUsuario));
router.get("/", asyncHandler(c.getAllResenas));
router.delete("/:id", auth, requireEmailVerified, asyncHandler(c.deleteResena));
router.put("/:id", auth, requireEmailVerified, asyncHandler(c.updateResena));

module.exports= router;