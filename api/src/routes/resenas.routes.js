const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const c = require("../controllers/resenas.controller");

const router = require("express").Router();


router.post("/", auth, asyncHandler(c.createResena));
router.get("/inmueble/:inmueble_id", asyncHandler(c.getResenasByInmuebleId));
router.get("/inmueble/:inmueble_id/usuario/:usuario_id", asyncHandler(c.getResenaByInmuebleAndUsuario));
router.get("/", asyncHandler(c.getAllResenas));
router.delete("/:id", auth, asyncHandler(c.deleteResena));
router.put("/:id", auth, asyncHandler(c.updateResena));

module.exports= router;