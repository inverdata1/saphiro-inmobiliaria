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
  });
  inmueble = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
});

afterAll(async () => {
  await pool.end();
});

function tokenFor(user) {
  return jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: "15m" });
}

describe("POST /guardados", () => {
  test("guarda un inmueble", async () => {
    const token = tokenFor(cliente);
    const res = await request(app)
      .post("/guardados")
      .set(csrfAuthHeaders(token))
      .send({ usuario_id: cliente.id, inmueble_id: inmueble.id });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test("lanza 400 si ya está guardado", async () => {
    const token = tokenFor(cliente);
    await request(app)
      .post("/guardados")
      .set(csrfAuthHeaders(token))
      .send({ usuario_id: cliente.id, inmueble_id: inmueble.id });

    const res = await request(app)
      .post("/guardados")
      .set(csrfAuthHeaders(token))
      .send({ usuario_id: cliente.id, inmueble_id: inmueble.id });

    expect(res.status).toBe(400);
  });
});

describe("GET /guardados/:usuario_id", () => {
  test("retorna guardados del usuario", async () => {
    const token = tokenFor(cliente);
    await request(app)
      .post("/guardados")
      .set(csrfAuthHeaders(token))
      .send({ usuario_id: cliente.id, inmueble_id: inmueble.id });

    const res = await request(app).get(`/guardados/${cliente.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

describe("GET /guardados/:usuario_id/:inmueble_id", () => {
  test("retorna true si está guardado", async () => {
    const token = tokenFor(cliente);
    await request(app)
      .post("/guardados")
      .set(csrfAuthHeaders(token))
      .send({ usuario_id: cliente.id, inmueble_id: inmueble.id });

    const res = await request(app).get(
      `/guardados/${cliente.id}/${inmueble.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toBe(true);
  });

  test("retorna false si no está guardado", async () => {
    const res = await request(app).get(
      `/guardados/${cliente.id}/${inmueble.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toBe(false);
  });
});

describe("DELETE /guardados/:usuario_id/:inmueble_id", () => {
  test("elimina un guardado", async () => {
    const token = tokenFor(cliente);
    await request(app)
      .post("/guardados")
      .set(csrfAuthHeaders(token))
      .send({ usuario_id: cliente.id, inmueble_id: inmueble.id });

    const res = await request(app)
      .delete(`/guardados/${cliente.id}/${inmueble.id}`)
      .set(csrfAuthHeaders(token));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
