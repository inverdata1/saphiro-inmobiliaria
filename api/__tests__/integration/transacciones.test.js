jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const request = require("supertest");
const pool = require("../../src/db/pool");
const app = require("../../app");
const { crearUsuario, crearCorredor, crearInmueble, csrfAuthHeaders } = require("../helpers");
const { cleanTables } = require("../setup");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

let cliente, corredor, inmueble;

beforeEach(async () => {
  await cleanTables(pool);
  cliente = await crearUsuario(pool, {
    nombre: "Cliente",
    email: "cliente@test.com",
    password: "123",
    email_verified: true,
  });
  corredor = await crearCorredor(pool, {
    nombre: "Corredor",
    email: "corredor@test.com",
    password: "123",
    comision_base: 5.0,
  });
  inmueble = await crearInmueble(pool, {
    corredor_id: corredor.corredor_id,
    precio: 100000,
  });
});

afterAll(async () => {
  await pool.end();
});

function tokenFor(user) {
  return jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: "15m" });
}

describe("POST /transacciones", () => {
  test("crea una transacción", async () => {
    const token = tokenFor(cliente);
    const res = await request(app)
      .post("/transacciones")
      .set(csrfAuthHeaders(token))
      .send({ inmueble_id: inmueble.id, cliente_id: cliente.id });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.tipo_operacion).toBe("venta");
  });

  test("lanza 401 sin auth", async () => {
    const res = await request(app)
      .post("/transacciones")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ inmueble_id: inmueble.id, cliente_id: cliente.id });

    expect(res.status).toBe(401);
  });

  test("lanza 403 si el propietario compra su propio inmueble", async () => {
    const token = tokenFor(corredor);
    const res = await request(app)
      .post("/transacciones")
      .set(csrfAuthHeaders(token))
      .send({ inmueble_id: inmueble.id, cliente_id: corredor.id });

    expect(res.status).toBe(403);
  });
});

describe("POST /transacciones/pago", () => {
  test("procesa un pago simulado", async () => {
    const token = tokenFor(cliente);
    const res = await request(app)
      .post("/transacciones/pago")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        monto: 100000,
        moneda: "USD",
        metodo_pago: "debito",
        codigo_seguridad: "123",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.aprobado).toBe(true);
    expect(res.body).toHaveProperty("transaccion_id");
  });

  test("lanza 400 si falta monto", async () => {
    const token = tokenFor(cliente);
    const res = await request(app)
      .post("/transacciones/pago")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        moneda: "USD",
        metodo_pago: "debito",
        codigo_seguridad: "123",
      });

    expect(res.status).toBe(400);
  });
});

describe("GET /transacciones", () => {
  test("retorna lista de transacciones", async () => {
    const res = await request(app).get("/transacciones");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });
});

describe("GET /transacciones/:id", () => {
  test("retorna transacción por ID", async () => {
    const token = tokenFor(cliente);
    const createRes = await request(app)
      .post("/transacciones")
      .set(csrfAuthHeaders(token))
      .send({ inmueble_id: inmueble.id, cliente_id: cliente.id });

    const id = createRes.body.data.id;
    const res = await request(app).get(`/transacciones/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  test("lanza 404 si no existe", async () => {
    const res = await request(app).get("/transacciones/99999");
    expect(res.status).toBe(404);
  });
});
