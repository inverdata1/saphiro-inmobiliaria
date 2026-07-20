const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/auth.controller");


router.post("/register/corredor", auth, admin, asyncHandler(c.registerCorredor));
router.post("/register/corredor/reinvitar", auth, admin, asyncHandler(c.reinvitarCorredor));
router.post("/register/admin/invitar", auth, admin, asyncHandler(c.invitarAdmin));
router.post("/register/admin/reinvitar", auth, admin, asyncHandler(c.reinvitarAdmin));
router.post("/register/admin/completar", asyncHandler(c.completarRegistroAdmin));
router.post("/register", asyncHandler(c.register));
router.post("/login", asyncHandler(c.login));
router.get("/me", auth, asyncHandler(c.me));
router.get("/registro-token/:rol/:token", asyncHandler(c.validarTokenRegistro));
router.post("/completar-registro", asyncHandler(c.completarRegistro));

//Recuperacion de contraseña
router.post("/forgot-password", asyncHandler(c.solicitarReset));
router.post("/verify-reset-code", asyncHandler(c.verificarCodigoReset));
router.post("/reset-password", asyncHandler(c.resetPassword));

module.exports = router;
