const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-for-jest-tests-only-abc123";

async function crearUsuario(pool, { nombre, email, password, rol = "cliente", email_verified = true }) {
  const password_hash = password ? await bcrypt.hash(String(password), 10) : null;
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, email_verified, active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, nombre, email, rol, email_verified;`,
    [nombre, email, password_hash, rol, email_verified]
  );
  return rows[0];
}

async function crearCorredor(pool, { nombre, email, password, comision_base = 5.0 }) {
  const user = await crearUsuario(pool, { nombre, email, password, rol: "corredor" });
  const { rows } = await pool.query(
    `INSERT INTO corredores (usuario_id, comision_base, licencia_nro, telefono)
     VALUES ($1, $2, $3, $4)
     RETURNING id, usuario_id, comision_base;`,
    [user.id, comision_base, "LIC-001", "0414-1234567"]
  );
  return { ...user, corredor_id: rows[0].id, comision_base: rows[0].comision_base };
}

async function crearInmueble(pool, { corredor_id, ciudad_id, titulo = "Inmueble Test", precio = 100000, estado_inmueble = "venta", tipo_inmueble_id }) {
  const { rows } = await pool.query(
    `INSERT INTO inmuebles (titulo, tipo_inmueble_id, estado_inmueble, precio, moneda, ciudad_id, corredor_id, direccion_exacta)
     VALUES ($1, $2, $3, $4, 'USD', $5, $6, 'Direccion Test 123')
     RETURNING *;`,
    [titulo, tipo_inmueble_id || 1, estado_inmueble, precio, ciudad_id || 1, corredor_id]
  );
  return rows[0];
}

async function crearTransaccionVendida(pool, { inmueble_id, cliente_id, monto_total = 100000 }) {
  const { rows } = await pool.query(
    `INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, estatus_pago, monto_total, moneda)
     VALUES ($1, $2, 'venta', 'pagado', $3, 'USD')
     RETURNING *;`,
    [inmueble_id, cliente_id, monto_total]
  );
  return rows[0];
}

function firmarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

function firmarRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function csrfHeader() {
  return { "X-Requested-With": "XMLHttpRequest", "User-Agent": "jest-test-agent" };
}

function csrfAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "jest-test-agent",
  };
}

module.exports = {
  crearUsuario,
  crearCorredor,
  crearInmueble,
  crearTransaccionVendida,
  firmarToken,
  firmarRefreshToken,
  authHeader,
  csrfHeader,
  csrfAuthHeaders,
};
