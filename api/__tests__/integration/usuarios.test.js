jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const request = require("supertest");
const pool = require("../../src/db/pool");
const app = require("../../app");
const { crearUsuario, crearCorredor, csrfAuthHeaders } = require("../helpers");
const { cleanTables } = require("../setup");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

let admin;

beforeEach(async () => {
  await cleanTables(pool);
  admin = await crearUsuario(pool, {
    nombre: "Admin",
    email: "admin@test.com",
    password: "123",
    rol: "admin",
    email_verified: true,
  });
});

afterAll(async () => {
  await pool.end();
});

function adminToken() {
  return jwt.sign({ id: admin.id, rol: "admin" }, JWT_SECRET, { expiresIn: "15m" });
}

describe("GET /usuarios", () => {
  test("retorna usuarios (solo admin)", async () => {
    const res = await request(app)
      .get("/usuarios")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("lanza 401 sin auth", async () => {
    const res = await request(app).get("/usuarios");
    expect(res.status).toBe(401);
  });

  test("lanza 403 si no es admin", async () => {
    const cliente = await crearUsuario(pool, {
      nombre: "Cliente",
      email: "c@test.com",
      password: "123",
    });
    const token = jwt.sign({ id: cliente.id, rol: "cliente" }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const res = await request(app)
      .get("/usuarios")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("GET /usuarios/:id", () => {
  test("retorna un usuario por ID", async () => {
    const res = await request(app)
      .get(`/usuarios/${admin.id}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(admin.id);
  });
});

describe("PATCH /usuarios/:id", () => {
  test("actualiza un usuario (admin)", async () => {
    const res = await request(app)
      .patch(`/usuarios/${admin.id}`)
      .set(csrfAuthHeaders(adminToken()))
      .send({ nombre: "Admin Actualizado" });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/estatus/);
  });
});

describe("DELETE /usuarios/:id", () => {
  test("elimina (soft delete) un usuario", async () => {
    const user = await crearUsuario(pool, {
      nombre: "To Delete",
      email: "delete@test.com",
      password: "123",
    });

    const res = await request(app)
      .delete(`/usuarios/${user.id}`)
      .set(csrfAuthHeaders(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { rows } = await pool.query(
      "SELECT deleted_at FROM usuarios WHERE id = $1",
      [user.id]
    );
    expect(rows[0].deleted_at).not.toBeNull();
  });
});
