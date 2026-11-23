jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const request = require("supertest");
const pool = require("../../src/db/pool");
const app = require("../../app");
const { crearUsuario, crearCorredor, crearInmueble } = require("../helpers");
const { cleanTables } = require("../setup");
const transaccionesService = require("../../src/services/transacciones.service");

let cliente, corredor, inmueble;

beforeEach(async () => {
  await cleanTables(pool);
  cliente = await crearUsuario(pool, {
    nombre: "Cliente",
    email: "cliente@test.com",
    password: "123",
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

describe("GET /dashboard/kpis", () => {
  test("retorna KPIs", async () => {
    const res = await request(app).get("/dashboard/kpis");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty("transacciones_count");
    expect(res.body.data).toHaveProperty("monto_total_sum");
  });

  test("filtra por fechas", async () => {
    const res = await request(app).get(
      "/dashboard/kpis?desde=2026-01-01&hasta=2026-12-31"
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("GET /dashboard/serie", () => {
  test("retorna serie temporal", async () => {
    const res = await request(app).get("/dashboard/serie");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /dashboard/top-corredores", () => {
  test("retorna top corredores", async () => {
    const res = await request(app).get("/dashboard/top-corredores");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
