jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const request = require("supertest");
const pool = require("../../src/db/pool");
const app = require("../../app");

afterAll(async () => {
  await pool.end();
});

describe("GET /geo/estados", () => {
  test("retorna lista de estados", async () => {
    const res = await request(app).get("/geo/estados");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("nombre");
  });
});

describe("GET /geo/ciudades", () => {
  test("retorna ciudades de un estado", async () => {
    const res = await request(app).get("/geo/ciudades?estado_id=1");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("lanza 400 si falta estado_id", async () => {
    const res = await request(app).get("/geo/ciudades");
    expect(res.status).toBe(400);
  });
});

describe("GET /geo/sectores", () => {
  test("retorna sectores de una ciudad", async () => {
    const res = await request(app).get("/geo/sectores?ciudad_id=1");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("lanza 400 si falta ciudad_id", async () => {
    const res = await request(app).get("/geo/sectores");
    expect(res.status).toBe(400);
  });
});
