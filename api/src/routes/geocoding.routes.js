const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const { geocodeLimiter } = require("../middleware/rateLimit");
const c = require("../controllers/geocoding.controller");

router.get("/forward", auth, geocodeLimiter, asyncHandler(c.forwardGeocode));
router.get("/reverse", auth, geocodeLimiter, asyncHandler(c.reverseGeocode));

module.exports = router;