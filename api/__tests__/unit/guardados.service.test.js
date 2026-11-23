const pool = require("../../src/db/pool");
const guardadosService = require("../../src/services/guardados.service");
const { crearUsuario, crearCorredor, crearInmueble } = require("../helpers");
const { cleanTables } = require("../setup");

let cliente, corredor, inmueble;

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
  });
  inmueble = await crearInmueble(pool, { corredor_id: corredor.corredor_id });
});

afterAll(async () => {
  await pool.end();
});

describe("guardados.service - saveInmueble", () => {
  test("guarda un inmueble correctamente", async () => {
    const result = await guardadosService.saveInmueble({
      usuario_id: cliente.id,
      inmueble_id: inmueble.id,
    });
    expect(result).toHaveProperty("id");
    expect(result.usuario_id).toBe(cliente.id);
    expect(result.inmueble_id).toBe(inmueble.id);
  });

  test("lanza error si el inmueble ya está guardado", async () => {
    await guardadosService.saveInmueble({
      usuario_id: cliente.id,
      inmueble_id: inmueble.id,
    });
    await expect(
      guardadosService.saveInmueble({
        usuario_id: cliente.id,
        inmueble_id: inmueble.id,
      })
    ).rejects.toThrow("ya guardado");
  });

  test("lanza error si el inmueble no existe", async () => {
    await expect(
      guardadosService.saveInmueble({
        usuario_id: cliente.id,
        inmueble_id: 99999,
      })
    ).rejects.toThrow("Inmueble no encontrado");
  });

  test("lanza error si el usuario no existe", async () => {
    await expect(
      guardadosService.saveInmueble({
        usuario_id: 99999,
        inmueble_id: inmueble.id,
      })
    ).rejects.toThrow("Usuario no encontrado");
  });
});

describe("guardados.service - getGuardado", () => {
  test("retorna true si está guardado", async () => {
    await guardadosService.saveInmueble({
      usuario_id: cliente.id,
      inmueble_id: inmueble.id,
    });
    const result = await guardadosService.getGuardado(cliente.id, inmueble.id);
    expect(result).toBe(true);
  });

  test("retorna false si no está guardado", async () => {
    const result = await guardadosService.getGuardado(cliente.id, inmueble.id);
    expect(result).toBe(false);
  });
});

describe("guardados.service - deleteGuardado", () => {
  test("elimina un guardado existente", async () => {
    await guardadosService.saveInmueble({
      usuario_id: cliente.id,
      inmueble_id: inmueble.id,
    });
    const result = await guardadosService.deleteGuardado(cliente.id, inmueble.id);
    expect(result).toHaveProperty("id");
  });

  test("retorna array vacío si no está guardado", async () => {
    const result = await guardadosService.deleteGuardado(cliente.id, inmueble.id);
    expect(result).toEqual([]);
  });
});

describe("guardados.service - listGuardadosByUsuario", () => {
  test("retorna guardados del usuario", async () => {
    await guardadosService.saveInmueble({
      usuario_id: cliente.id,
      inmueble_id: inmueble.id,
    });
    const result = await guardadosService.listGuardadosByUsuario(cliente.id);
    expect(result.length).toBe(1);
  });

  test("lanza error 404 si el usuario no tiene guardados", async () => {
    await expect(guardadosService.listGuardadosByUsuario(cliente.id)).rejects.toThrow(
      "Inmueble no encontrado"
    );
  });
});
