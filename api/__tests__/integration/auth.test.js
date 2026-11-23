jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const request = require("supertest");
const pool = require("../../src/db/pool");
const app = require("../../app");
const { crearUsuario, csrfHeader } = require("../helpers");
const { cleanTables } = require("../setup");

beforeEach(async () => {
  await cleanTables(pool);
});

afterAll(async () => {
  await pool.end();
});

describe("POST /auth/register", () => {
  test("registra un cliente nuevo", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set(csrfHeader())
      .send({ nombre: "Nuevo", email: "nuevo@test.com", password: "123456" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.email).toBe("nuevo@test.com");
  });

  test("lanza 409 si el email ya existe", async () => {
    await crearUsuario(pool, { nombre: "Exist", email: "dup@test.com", password: "123" });
    const res = await request(app)
      .post("/auth/register")
      .set(csrfHeader())
      .send({ nombre: "Test", email: "dup@test.com", password: "123456" });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
  });

  test("lanza 400 si falta campos", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set(csrfHeader())
      .send({ email: "test@test.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  test("login exitoso", async () => {
    await crearUsuario(pool, {
      nombre: "Login",
      email: "login@test.com",
      password: "123456",
      email_verified: true,
    });

    const res = await request(app)
      .post("/auth/login")
      .set(csrfHeader())
      .send({ email: "login@test.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.user.email).toBe("login@test.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("lanza 401 con password incorrecto", async () => {
    await crearUsuario(pool, {
      nombre: "User",
      email: "wrong@test.com",
      password: "correct",
      email_verified: true,
    });

    const res = await request(app)
      .post("/auth/login")
      .set(csrfHeader())
      .send({ email: "wrong@test.com", password: "incorrecta" });

    expect(res.status).toBe(401);
  });

  test("lanza 403 si el email no está verificado", async () => {
    await crearUsuario(pool, {
      nombre: "Unverified",
      email: "unverified@test.com",
      password: "123456",
      email_verified: false,
    });

    const res = await request(app)
      .post("/auth/login")
      .set(csrfHeader())
      .send({ email: "unverified@test.com", password: "123456" });

    expect(res.status).toBe(403);
  });
});

describe("POST /auth/verify-email", () => {
  test("verifica email con token válido", async () => {
    const user = await crearUsuario(pool, {
      nombre: "Verify",
      email: "verify@test.com",
      password: "123",
      email_verified: false,
    });

    const redis = require("../../src/services/redis.service");
    await redis.setex("email-verify:test-token", 86400, String(user.id));

    const res = await request(app)
      .post("/auth/verify-email")
      .set(csrfHeader())
      .send({ token: "test-token" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("lanza 404 con token inválido", async () => {
    const res = await request(app)
      .post("/auth/verify-email")
      .set(csrfHeader())
      .send({ token: "invalid" });

    expect(res.status).toBe(404);
  });
});

describe("POST /auth/forgot-password", () => {
  test("solicita reset exitosamente", async () => {
    await crearUsuario(pool, {
      nombre: "Reset",
      email: "reset@test.com",
      password: "123",
    });

    const res = await request(app)
      .post("/auth/forgot-password")
      .set(csrfHeader())
      .send({ email: "reset@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("lanza 404 si el email no existe", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .set(csrfHeader())
      .send({ email: "nonexistent@test.com" });

    expect(res.status).toBe(404);
  });
});

describe("GET /auth/me", () => {
  test("retorna datos del usuario autenticado", async () => {
    const user = await crearUsuario(pool, {
      nombre: "Me",
      email: "me@test.com",
      password: "123",
    });

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .set("User-Agent", "jest-test-agent");

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("me@test.com");
  });

  test("lanza 401 sin token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  test("cierra sesión", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .set(csrfHeader());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
