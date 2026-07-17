const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/sectores.controller");

router.get("/", asyncHandler(c.listSectores));

module.exports = router;
