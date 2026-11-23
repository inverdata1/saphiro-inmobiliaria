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

describe("POST /resenas", () => {
  test("crea una reseña", async () => {
    const token = tokenFor(cliente);
    const res = await request(app)
      .post("/resenas")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        usuario_id: cliente.id,
        estrellas: 5,
        comentario: "Excelente inmueble",
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.estrellas).toBe(5);
  });

  test("lanza 403 si el propietario escribe reseña", async () => {
    const token = tokenFor(corredor);
    const res = await request(app)
      .post("/resenas")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        usuario_id: corredor.id,
        estrellas: 5,
        comentario: "Mi inmueble",
      });

    expect(res.status).toBe(403);
  });
});

describe("GET /resenas/inmueble/:inmueble_id", () => {
  test("retorna reseñas de un inmueble", async () => {
    const token = tokenFor(cliente);
    await request(app)
      .post("/resenas")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        usuario_id: cliente.id,
        estrellas: 4,
        comentario: "Muy bueno",
      });

    const res = await request(app).get(`/resenas/inmueble/${inmueble.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test("retorna array vacío si no hay reseñas", async () => {
    const res = await request(app).get(`/resenas/inmueble/${inmueble.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

describe("DELETE /resenas/:id", () => {
  test("elimina una reseña", async () => {
    const token = tokenFor(cliente);
    const createRes = await request(app)
      .post("/resenas")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        usuario_id: cliente.id,
        estrellas: 3,
        comentario: "Para borrar",
      });

    const resenaId = createRes.body.data.id;
    const res = await request(app)
      .delete(`/resenas/${resenaId}`)
      .set(csrfAuthHeaders(token));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("PUT /resenas/:id", () => {
  test("actualiza una reseña", async () => {
    const token = tokenFor(cliente);
    const createRes = await request(app)
      .post("/resenas")
      .set(csrfAuthHeaders(token))
      .send({
        inmueble_id: inmueble.id,
        usuario_id: cliente.id,
        estrellas: 3,
        comentario: "Original",
      });

    const resenaId = createRes.body.data.id;
    const res = await request(app)
      .put(`/resenas/${resenaId}`)
      .set(csrfAuthHeaders(token))
      .send({ estrellas: 5, comentario: "Actualizado" });

    expect(res.status).toBe(200);
    expect(res.body.data.estrellas).toBe(5);
    expect(res.body.data.comentario).toBe("Actualizado");
  });
});
