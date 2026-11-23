const pool = require("../../src/db/pool");
const comisionesService = require("../../src/services/comisiones.service");
const transaccionesService = require("../../src/services/transacciones.service");
const { crearUsuario, crearCorredor, crearInmueble } = require("../helpers");
const { cleanTables } = require("../setup");

let cliente, corredor, inmueble, transaccion;

beforeEach(async () => {
  await cleanTables(pool);
  cliente = await crearUsuario(pool, {
    nombre: "Cliente Test",
    email: "cliente@test.com",
    password: "123",
  });
  corredor = await crearCorredor(pool, {
    nombre: "Corredor Test",
    email: "corredor@test.com",
    password: "123",
    comision_base: 10.0,
  });
  inmueble = await crearInmueble(pool, {
    corredor_id: corredor.corredor_id,
    precio: 200000,
  });

  await transaccionesService.procesarPago({
    inmueble_id: inmueble.id,
    cliente_id: cliente.id,
    monto: 200000,
    moneda: "USD",
    metodo_pago: "debito",
    codigo_seguridad: "123",
  });

  const { rows } = await pool.query(
    "SELECT * FROM comisiones ORDER BY id DESC LIMIT 1"
  );
  transaccion = rows[0];
});

afterAll(async () => {
  await pool.end();
});

describe("comisiones.service - listComisiones", () => {
  test("retorna comisiones con paginación", async () => {
    const result = await comisionesService.listComisiones({});
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("pagination");
    expect(result.data.length).toBeGreaterThanOrEqual(1);
  });

  test("filtra por corredor_id", async () => {
    const result = await comisionesService.listComisiones({
      corredor_id: corredor.id,
    });
    expect(result.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe("comisiones.service - getComisionById", () => {
  test("retorna comisión por ID", async () => {
    const result = await comisionesService.getComisionById(transaccion.id);
    expect(result.id).toBe(transaccion.id);
    expect(Number(result.monto_comision)).toBe(20000);
  });

  test("lanza error 404 si no existe", async () => {
    await expect(comisionesService.getComisionById(99999)).rejects.toThrow("Comisión no existe");
  });
});
