const pool = require("../../src/db/pool");
const transaccionesService = require("../../src/services/transacciones.service");
const { crearUsuario, crearCorredor, crearInmueble } = require("../helpers");
const { cleanTables } = require("../setup");

let cliente, corredor, inmueble;

beforeEach(async () => {
  await cleanTables(pool);
  cliente = await crearUsuario(pool, {
    nombre: "Cliente Test",
    email: "cliente@test.com",
    password: "123",
    email_verified: true,
  });
  corredor = await crearCorredor(pool, {
    nombre: "Corredor Test",
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

describe("transacciones.service - createTransaccion", () => {
  test("crea una transacción correctamente", async () => {
    const result = await transaccionesService.createTransaccion({
      inmueble_id: inmueble.id,
      cliente_id: cliente.id,
      estatus_pago: "pendiente",
    });
    expect(result).toHaveProperty("id");
    expect(result.tipo_operacion).toBe("venta");
    expect(Number(result.monto_total)).toBe(100000);
  });

  test("lanza error si falta inmueble_id", async () => {
    await expect(
      transaccionesService.createTransaccion({ cliente_id: cliente.id })
    ).rejects.toThrow("inmueble_id es obligatorio");
  });

  test("lanza error si falta cliente_id", async () => {
    await expect(
      transaccionesService.createTransaccion({ inmueble_id: inmueble.id })
    ).rejects.toThrow("cliente_id es obligatorio");
  });

  test("lanza error si estatus_pago es inválido", async () => {
    await expect(
      transaccionesService.createTransaccion({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        estatus_pago: "cancelado",
      })
    ).rejects.toThrow("estatus_pago inválido");
  });

  test("lanza error 403 si el propietario compra su propio inmueble", async () => {
    await expect(
      transaccionesService.createTransaccion({
        inmueble_id: inmueble.id,
        cliente_id: corredor.id,
      })
    ).rejects.toThrow("propio inmueble");
  });

  test("lanza error 400 si un admin es cliente", async () => {
    const admin = await crearUsuario(pool, {
      nombre: "Admin",
      email: "admin@test.com",
      password: "123",
      rol: "admin",
    });
    await expect(
      transaccionesService.createTransaccion({
        inmueble_id: inmueble.id,
        cliente_id: admin.id,
      })
    ).rejects.toThrow("admin no puede ser cliente");
  });
});

describe("transacciones.service - procesarPago", () => {
  test("procesa un pago simulado correctamente", async () => {
    const result = await transaccionesService.procesarPago({
      inmueble_id: inmueble.id,
      cliente_id: cliente.id,
      monto: 100000,
      moneda: "USD",
      metodo_pago: "debito",
      codigo_seguridad: "123",
    });

    expect(result.ok).toBe(true);
    expect(result.aprobado).toBe(true);
    expect(result).toHaveProperty("transaccion_id");
    expect(result.monto).toBe(100000);
    expect(result.moneda).toBe("USD");
  });

  test("lanza error si falta monto", async () => {
    await expect(
      transaccionesService.procesarPago({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        moneda: "USD",
        metodo_pago: "debito",
        codigo_seguridad: "123",
      })
    ).rejects.toThrow("monto inválido");
  });

  test("lanza error si moneda es inválida", async () => {
    await expect(
      transaccionesService.procesarPago({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        monto: 100,
        moneda: "INVALID",
        metodo_pago: "debito",
        codigo_seguridad: "123",
      })
    ).rejects.toThrow("moneda inválida");
  });

  test("lanza error si método de pago es inválido", async () => {
    await expect(
      transaccionesService.procesarPago({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        monto: 100,
        moneda: "USD",
        metodo_pago: "paypal",
        codigo_seguridad: "123",
      })
    ).rejects.toThrow("metodo_pago inválido");
  });

  test("lanza error si codigo_seguridad no tiene 3 dígitos", async () => {
    await expect(
      transaccionesService.procesarPago({
        inmueble_id: inmueble.id,
        cliente_id: cliente.id,
        monto: 100,
        moneda: "USD",
        metodo_pago: "debito",
        codigo_seguridad: "12",
      })
    ).rejects.toThrow("codigo_seguridad debe ser 3 de dígitos");
  });

  test("marca estatus como pagado y crea comisión", async () => {
    await transaccionesService.procesarPago({
      inmueble_id: inmueble.id,
      cliente_id: cliente.id,
      monto: 100000,
      moneda: "USD",
      metodo_pago: "credito",
      codigo_seguridad: "123",
    });

    const { rows } = await pool.query(
      "SELECT estatus_pago FROM transacciones WHERE inmueble_id = $1 ORDER BY id DESC LIMIT 1",
      [inmueble.id]
    );
    expect(rows[0].estatus_pago).toBe("pagado");

    const { rows: comision } = await pool.query(
      "SELECT * FROM comisiones WHERE transaccion_id = (SELECT id FROM transacciones WHERE inmueble_id = $1 ORDER BY id DESC LIMIT 1)",
      [inmueble.id]
    );
    expect(comision.length).toBe(1);
    expect(Number(comision[0].porcentaje_aplicado)).toBe(5.0);
  });
});

describe("transacciones.service - listTransacciones", () => {
  test("retorna transacciones con paginación", async () => {
    await transaccionesService.createTransaccion({
      inmueble_id: inmueble.id,
      cliente_id: cliente.id,
    });
    const result = await transaccionesService.listTransacciones({});
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("pagination");
    expect(result.data.length).toBe(1);
    expect(result.pagination.total).toBe(1);
  });
});
