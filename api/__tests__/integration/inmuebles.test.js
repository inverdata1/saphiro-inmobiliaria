jest.mock("../../src/services/redis.service", () => require("../__mocks__/redis.service.js"));
jest.mock("../../src/services/email.service", () => require("../__mocks__/email.service.js"));

const request = require("supertest");
const pool = require("../../src/db/pool");
const app = require("../../app");
const { crearUsuario, crearCorredor, crearInmueble, crearTransaccionVendida, csrfAuthHeaders } = require("../helpers");
const { cleanTables } = require("../setup");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

let cliente, corredor;

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
});

afterAll(async () => {
  await pool.end();
});

function tokenFor(user) {
  return jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: "15m" });
}

describe("GET /inmuebles", () => {
  test("retorna lista vacía si no hay inmuebles", async () => {
    const res = await request(app).get("/inmuebles");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("retorna inmuebles creados", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const res = await request(app).get("/inmuebles");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test("filtra por estatus", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const vendido = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    await crearTransaccionVendida(pool, { inmueble_id: vendido.id, cliente_id: cliente.id });

    const res = await request(app).get("/inmuebles?estatus=disponible");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

describe("GET /inmuebles/:id", () => {
  test("retorna un inmueble por ID", async () => {
    const inm = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const res = await request(app).get(`/inmuebles/${inm.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(inm.id);
    expect(res.body.data.imagenes).toBeDefined();
  });

  test("lanza 404 si no existe", async () => {
    const res = await request(app).get("/inmuebles/99999");
    expect(res.status).toBe(404);
  });
});

describe("POST /inmuebles", () => {
  test("crea un inmueble con auth", async () => {
    const token = tokenFor(corredor);
    const res = await request(app)
      .post("/inmuebles")
      .set(csrfAuthHeaders(token))
      .field("titulo", "Nuevo Inmueble")
      .field("tipo_inmueble_id", "1")
      .field("estado_inmueble", "venta")
      .field("precio", "150000")
      .field("ciudad_id", "1")
      .field("direccion_exacta", "Av. Principal 123")
      .field("usuario_id", String(corredor.id));

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.titulo).toBe("Nuevo Inmueble");
  });

  test("lanza 401 sin auth", async () => {
    const res = await request(app)
      .post("/inmuebles")
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ titulo: "Test", estado_inmueble: "venta", precio: 100 });

    expect(res.status).toBe(401);
  });

  test("lanza 403 sin CSRF header", async () => {
    const token = tokenFor(corredor);
    const res = await request(app)
      .post("/inmuebles")
      .set("Authorization", `Bearer ${token}`)
      .send({ titulo: "Test", estado_inmueble: "venta", precio: 100 });

    expect(res.status).toBe(403);
  });
});

describe("PATCH /inmuebles/:id", () => {
  test("actualiza un inmueble", async () => {
    const inm = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const token = tokenFor(corredor);

    const res = await request(app)
      .patch(`/inmuebles/${inm.id}`)
      .set(csrfAuthHeaders(token))
      .send({ titulo: "Titulo Actualizado" });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe("Titulo Actualizado");
  });
});

describe("GET /inmuebles/corredor/:usuario_id", () => {
  test("retorna inmuebles del corredor autenticado", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const token = tokenFor(corredor);

    const res = await request(app)
      .get(`/inmuebles/corredor/${corredor.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});
