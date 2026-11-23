const pool = require("../../src/db/pool");
const resenasService = require("../../src/services/resenas.service");
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

describe("resenas.service - createResena", () => {
  test("crea una reseña correctamente", async () => {
    const result = await resenasService.createResena({
      inmueble_id: inmueble.id,
      usuario_id: cliente.id,
      estrellas: 4,
      comentario: "Muy bonito inmueble",
    });
    expect(result).toHaveProperty("id");
    expect(result.estrellas).toBe(4);
    expect(result.comentario).toBe("Muy bonito inmueble");
  });

  test("lanza error si falta comentario", async () => {
    await expect(
      resenasService.createResena({
        inmueble_id: inmueble.id,
        usuario_id: cliente.id,
        estrellas: 4,
      })
    ).rejects.toThrow("comentario son requeridos");
  });

  test("lanza error 404 si el inmueble no existe", async () => {
    await expect(
      resenasService.createResena({
        inmueble_id: 99999,
        usuario_id: cliente.id,
        estrellas: 4,
        comentario: "Test",
      })
    ).rejects.toThrow("inmueble no existe");
  });

  test("lanza error 403 si el propietario escribe reseña en su propio inmueble", async () => {
    await expect(
      resenasService.createResena({
        inmueble_id: inmueble.id,
        usuario_id: corredor.id,
        estrellas: 5,
        comentario: "Mi propio inmueble",
      })
    ).rejects.toThrow("propio inmueble");
  });
});

describe("resenas.service - getResenasByInmuebleId", () => {
  test("retorna reseñas de un inmueble", async () => {
    await resenasService.createResena({
      inmueble_id: inmueble.id,
      usuario_id: cliente.id,
      estrellas: 5,
      comentario: "Excelente",
    });
    const result = await resenasService.getResenasByInmuebleId(inmueble.id);
    expect(result.length).toBe(1);
    expect(result[0].comentario).toBe("Excelente");
  });

  test("retorna array vacío si no hay reseñas", async () => {
    const result = await resenasService.getResenasByInmuebleId(inmueble.id);
    expect(result.length).toBe(0);
  });
});

describe("resenas.service - deleteResena", () => {
  test("elimina una reseña existente", async () => {
    const resena = await resenasService.createResena({
      inmueble_id: inmueble.id,
      usuario_id: cliente.id,
      estrellas: 3,
      comentario: "Regular",
    });
    const result = await resenasService.deleteResena(resena.id);
    expect(result.id).toBe(resena.id);
  });

  test("lanza error 404 si la reseña no existe", async () => {
    await expect(resenasService.deleteResena(99999)).rejects.toThrow("Reseña no encontrada");
  });
});

describe("resenas.service - updateResena", () => {
  test("actualiza estrellas", async () => {
    const resena = await resenasService.createResena({
      inmueble_id: inmueble.id,
      usuario_id: cliente.id,
      estrellas: 3,
      comentario: "Regular",
    });
    const updated = await resenasService.updateResena(resena.id, { estrellas: 5 });
    expect(updated.estrellas).toBe(5);
  });

  test("lanza error si no hay campos para actualizar", async () => {
    const resena = await resenasService.createResena({
      inmueble_id: inmueble.id,
      usuario_id: cliente.id,
      estrellas: 3,
      comentario: "Test",
    });
    await expect(resenasService.updateResena(resena.id, {})).rejects.toThrow(
      "No hay campos para actualizar"
    );
  });
});
