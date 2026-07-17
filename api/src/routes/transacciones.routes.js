const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  createTransaccion,
  listTransacciones,
  getTransaccionById,
} = require("../controllers/transacciones.controller");

router.get("/", listTransacciones);
router.get("/:id", getTransaccionById);
router.post("/", auth, createTransaccion);

module.exports = router;