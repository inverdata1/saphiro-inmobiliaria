require("dotenv").config({ path: require("path").join(__dirname, ".env.test") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const inmueblesRoutes = require("./src/routes/inmuebles.routes");
const transaccionesRoutes = require("./src/routes/transacciones.routes");
const comisionesRoutes = require("./src/routes/comisiones.routes");
const reportesRoutes = require("./src/routes/reportes.routes");
const dashBoardRoutes = require("./src/routes/dashBoard.routes");
const auditoriaRoutes = require("./src/routes/auditoria.routes");
const gpsRoutes = require("./src/routes/gps.routes");
const geoRoutes = require("./src/routes/geo.routes");
const estadosRoutes = require("./src/routes/estados.routes");
const ciudadesRoutes = require("./src/routes/ciudades.routes");
const sectoresRoutes = require("./src/routes/sectores.routes");
const tiposRoutes = require("./src/routes/tiposInmuebles.routes");
const corredoresRoutes = require("./src/routes/corredores.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");
const authRoutes = require("./src/routes/auth.routes");
const imagenesRoutes = require("./src/routes/imagenes.routes");
const caracteristicasRoutes = require("./src/routes/caracteristicas.routes");
const resenasRoutes = require("./src/routes/resenas.routes");
const guardadosRoutes = require("./src/routes/guardados.routes");
const tasasRoutes = require("./src/routes/tasasCambio.routes");
const reservasRoutes = require("./src/routes/reservas.routes");
const errorHandler = require("./src/middleware/errorHandler");
const csrf = require("./src/middleware/csrf");

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(csrf);
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.get("/dbtest", async (_req, res) => {
  const pool = require("./src/db/pool");
  try {
    const r = await pool.query(
      "SELECT current_database() as db, current_user as usr, inet_server_port() as port;"
    );
    res.json({ ok: true, conn: r.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.use("/inmuebles", inmueblesRoutes);
app.use("/transacciones", transaccionesRoutes);
app.use("/comisiones", comisionesRoutes);
app.use("/reportes", reportesRoutes);
app.use("/dashboard", dashBoardRoutes);
app.use("/auditoria", auditoriaRoutes);
app.use("/gps", gpsRoutes);
app.use("/geo", geoRoutes);
app.use("/corredores", corredoresRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/auth", authRoutes);
app.use("/tipos", tiposRoutes);
app.use("/estados", estadosRoutes);
app.use("/ciudades", ciudadesRoutes);
app.use("/sectores", sectoresRoutes);
app.use("/imagenes", imagenesRoutes);
app.use("/caracteristicas", caracteristicasRoutes);
app.use("/resenas", resenasRoutes);
app.use("/guardados", guardadosRoutes);
app.use("/tasas", tasasRoutes);
app.use("/reservas", reservasRoutes);

app.use(errorHandler);

module.exports = app;
