const pool = require("../../src/db/pool");
const inmueblesService = require("../../src/services/inmuebles.service");
const { crearUsuario, crearCorredor, crearInmueble, crearTransaccionVendida } = require("../helpers");
const { cleanTables } = require("../setup");

let corredor;

beforeEach(async () => {
  await cleanTables(pool);
  corredor = await crearCorredor(pool, {
    nombre: "Corredor Test",
    email: "corredor@test.com",
    password: "123",
  });
});

afterAll(async () => {
  await pool.end();
});

describe("inmuebles.service - listInmuebles", () => {
  test("retorna array vacío si no hay inmuebles", async () => {
    const result = await inmueblesService.listInmuebles({});
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test("lista inmuebles con filtros", async () => {
    await crearInmueble(pool, {
      corredor_id: corredor.corredor_id,
      titulo: "Apartamento Centro",
      precio: 150000,
    });
    await crearInmueble(pool, {
      corredor_id: corredor.corredor_id,
      titulo: "Casa Norte",
      precio: 250000,
    });

    const result = await inmueblesService.listInmuebles({});
    expect(result.data.length).toBe(2);
  });

  test("filtra por precio min", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id, precio: 50000 });
    await crearInmueble(pool, { corredor_id: corredor.corredor_id, precio: 200000 });

    const result = await inmueblesService.listInmuebles({ min: 100000 });
    expect(result.data.length).toBe(1);
    expect(Number(result.data[0].precio)).toBe(200000);
  });

  test("filtra por estatus", async () => {
    const cliente = await crearUsuario(pool, { nombre: "Cliente", email: "cliente@test.com", password: "123" });
    await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const vendido = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    await crearTransaccionVendida(pool, { inmueble_id: vendido.id, cliente_id: cliente.id });

    const result = await inmueblesService.listInmuebles({ estatus: "disponible" });
    expect(result.data.length).toBe(1);
  });

  test("filtra por búsqueda de texto", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Penthouse Luxury" });
    await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Studio Simple" });

    const result = await inmueblesService.listInmuebles({ q: "Penthouse" });
    expect(result.data.length).toBe(1);
    expect(result.data[0].titulo).toBe("Penthouse Luxury");
  });

  test("lista todos los inmuebles por defecto, incluidos vendidos", async () => {
    const cliente = await crearUsuario(pool, { nombre: "Cliente", email: "cliente@test.com", password: "123" });
    await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const vendido = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    await crearTransaccionVendida(pool, { inmueble_id: vendido.id, cliente_id: cliente.id });

    const result = await inmueblesService.listInmuebles({});
    expect(result.data.length).toBe(2);
    expect(result.data.map((i) => i.estatus)).toContain("vendido");
  });

  test("ordena por precio ascendente", async () => {
    const caro = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Caro", precio: 300000 });
    const medio = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Medio", precio: 200000 });
    const barato = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Barato", precio: 100000 });

    const result = await inmueblesService.listInmuebles({ sort: "price_asc" });
    expect(result.data.map((i) => i.id)).toEqual([barato.id, medio.id, caro.id]);
  });

  test("ordena por precio descendente", async () => {
    const caro = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Caro", precio: 300000 });
    const medio = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Medio", precio: 200000 });
    const barato = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "Barato", precio: 100000 });

    const result = await inmueblesService.listInmuebles({ sort: "price_desc" });
    expect(result.data.map((i) => i.id)).toEqual([caro.id, medio.id, barato.id]);
  });

  test("ordena por más recientes por defecto", async () => {
    const primero = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const segundo = await crearInmueble(pool, { corredor_id: corredor.corredor_id });

    const result = await inmueblesService.listInmuebles({});
    expect(result.data.map((i) => i.id)).toEqual([segundo.id, primero.id]);
  });

  test("filtra por moneda", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "En USD", precio: 100000 });
    const vendidoBs = await crearInmueble(pool, { corredor_id: corredor.corredor_id, titulo: "En BS", precio: 100000, estado_inmueble: "venta" });
    await pool.query(
      `UPDATE inmuebles SET moneda = 'BS' WHERE id = $1;`,
      [vendidoBs.id]
    );

    const result = await inmueblesService.listInmuebles({ moneda: "BS" });
    expect(result.data.length).toBe(1);
    expect(result.data[0].titulo).toBe("En BS");
  });

  test("sort inválido cae a más recientes", async () => {
    const primero = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const segundo = await crearInmueble(pool, { corredor_id: corredor.corredor_id });

    const result = await inmueblesService.listInmuebles({ sort: "DROP TABLE inmuebles" });
    expect(result.data.map((i) => i.id)).toEqual([segundo.id, primero.id]);
  });
});

describe("inmuebles.service - getInmuebleById", () => {
  test("retorna inmueble por ID", async () => {
    const inm = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const result = await inmueblesService.getInmuebleById(inm.id);
    expect(result.id).toBe(inm.id);
    expect(result.titulo).toBe("Inmueble Test");
  });

  test("lanza error 404 si no existe", async () => {
    await expect(inmueblesService.getInmuebleById(99999)).rejects.toThrow("Inmueble no existe");
  });

  test("lanza error 400 si id es falsy", async () => {
    await expect(inmueblesService.getInmuebleById(null)).rejects.toThrow("id inválido");
  });
});

describe("inmuebles.service - createInmueble", () => {
  test("crea inmueble con datos mínimos", async () => {
    const result = await inmueblesService.createInmueble({
      titulo: "Nuevo Inmueble",
      tipo_inmueble_id: 1,
      estado_inmueble: "venta",
      precio: 100000,
      corredor_id: corredor.corredor_id,
      ciudad_id: 1,
      direccion_exacta: "Av. Principal 123",
    });

    expect(result).toHaveProperty("id");
    expect(result.titulo).toBe("Nuevo Inmueble");
    expect(Number(result.precio)).toBe(100000);
  });

  test("lanza error si falta titulo", async () => {
    await expect(
      inmueblesService.createInmueble({
        estado_inmueble: "venta",
        precio: 100000,
        corredor_id: corredor.corredor_id,
      })
    ).rejects.toThrow("titulo es requerido");
  });

  test("lanza error si falta estado_inmueble", async () => {
    await expect(
      inmueblesService.createInmueble({
        titulo: "Test",
        precio: 100000,
        corredor_id: corredor.corredor_id,
      })
    ).rejects.toThrow("estado_inmueble es requerido");
  });

  test("lanza error si falta precio", async () => {
    await expect(
      inmueblesService.createInmueble({
        titulo: "Test",
        estado_inmueble: "venta",
        corredor_id: corredor.corredor_id,
      })
    ).rejects.toThrow("precio es requerido");
  });
});

describe("inmuebles.service - patchInmueble", () => {
  test("actualiza campos permitidos", async () => {
    const inm = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const updated = await inmueblesService.patchInmueble(inm.id, { titulo: "Titulo Actualizado" });
    expect(updated.titulo).toBe("Titulo Actualizado");
  });

  test("lanza error 404 si no existe", async () => {
    await expect(
      inmueblesService.patchInmueble(99999, { titulo: "test" })
    ).rejects.toThrow("Inmueble no existe");
  });

  test("lanza error si no hay campos válidos", async () => {
    const inm = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    await expect(
      inmueblesService.patchInmueble(inm.id, { campoInvalido: "test" })
    ).rejects.toThrow("No hay campos válidos");
  });
});

describe("inmuebles.service - listInmueblesByCorredor", () => {
  test("retorna inmuebles del corredor", async () => {
    await crearInmueble(pool, { corredor_id: corredor.corredor_id });
    const result = await inmueblesService.listInmueblesByCorredor(corredor.id);
    expect(result.length).toBe(1);
    expect(result[0].corredor_id).toBe(corredor.corredor_id);
  });

  test("lanza error si falta usuarioId", async () => {
    await expect(inmueblesService.listInmueblesByCorredor(null)).rejects.toThrow(
      "usuario_id requerido"
    );
  });
});
