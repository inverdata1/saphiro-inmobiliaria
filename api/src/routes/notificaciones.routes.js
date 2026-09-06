const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const c = require("../controllers/notificaciones.controller");

router.post("/", auth, asyncHandler(c.create));
router.get("/:usuario_id", auth, asyncHandler(c.getByUser));
router.get("/:usuario_id/unread", auth, asyncHandler(c.getUnreadByUser));
router.patch("/:id/read", auth, asyncHandler(c.markAsRead));
router.patch("/:usuario_id/read-all", auth, asyncHandler(c.markAllAsRead));
router.delete("/:id", auth, asyncHandler(c.remove));
router.delete("/user/:usuario_id", auth, asyncHandler(c.removeAllByUser));

module.exports = router;
