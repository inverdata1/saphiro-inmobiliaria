const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const { listAuditoria } = require("../controllers/auditoria.controller");

router.get("/", asyncHandler(listAuditoria));

module.exports = router;
