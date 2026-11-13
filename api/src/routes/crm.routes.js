const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/crm.controller");

router.use(auth);
router.get("/resumen", asyncHandler(c.resumen));
router.get("/leads", asyncHandler(c.leads));
router.post("/leads", asyncHandler(c.crearLead));
router.patch("/leads/:id", asyncHandler(c.moverLead));
router.get("/propiedades", asyncHandler(c.propiedades));
router.get("/clientes", asyncHandler(c.clientes));
router.get("/citas", asyncHandler(c.citas));

module.exports = router;
