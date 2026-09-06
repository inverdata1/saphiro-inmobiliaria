const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/auth.controller");
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require("../middleware/rateLimit");


router.post("/register/corredor", auth, admin, asyncHandler(c.registerCorredor));
router.post("/register/corredor/reinvitar", auth, admin, asyncHandler(c.reinvitarCorredor));
router.post("/register/admin/invitar", auth, admin, asyncHandler(c.invitarAdmin));
router.post("/register/admin/reinvitar", auth, admin, asyncHandler(c.reinvitarAdmin));
router.post("/register/admin/completar", asyncHandler(c.completarRegistroAdmin));
router.post("/register", registerLimiter, asyncHandler(c.register));
router.post("/login", loginLimiter, asyncHandler(c.login));
router.post("/refresh", asyncHandler(c.refresh));
router.post("/logout", asyncHandler(c.logout));
router.get("/me", auth, asyncHandler(c.me));

// Completar registro (invitaciones)
router.get("/registro-token/:rol/:token", asyncHandler(c.validarTokenRegistro));
router.post("/completar-registro", asyncHandler(c.completarRegistro));

//Verificación de correo
router.post("/verify-email", asyncHandler(c.verificarEmail));
router.post("/resend-verification", asyncHandler(c.reenviarVerificacion));

//Recuperacion de contraseña
router.post("/forgot-password", forgotPasswordLimiter, asyncHandler(c.solicitarReset));
router.post("/verify-reset-code", asyncHandler(c.verificarCodigoReset));
router.post("/reset-password", asyncHandler(c.resetPassword));

module.exports = router;
