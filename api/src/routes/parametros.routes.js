const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const c = require("../controllers/parametros.controller");

router.get("/", asyncHandler(c.get));
router.put("/", auth, admin, asyncHandler(c.update));

module.exports = router;
