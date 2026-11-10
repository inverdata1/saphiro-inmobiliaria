const pool = require("../db/pool");
const AppError = require("../utils/AppError");

// Formato canonico RFC 4122 (8-4-4-4-12, hex). No valida version/variante a
// proposito: `gen_random_uuid()` genera v4, pero aceptar cualquier version
// evita 404 raros si manana se migran UUIDs de otra fuente.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esUuid = (valor) => typeof valor === "string" && UUID_RE.test(valor);

// Traduce el UUID publico de la URL al `id` interno que esperan los servicios.
//
// Se puede montar de dos formas:
//   * `router.param(nombre, resolveUuidParam(...))` — corre para cualquier ruta
//     que declare ese parametro.
//   * `router.get("/x/:nombre", resolveUuidParam(...), handler)` — middleware de
//     ruta. Es la forma que usan los routers donde `:id` significa cosas
//     distintas segun la ruta (p. ej. contratos: usuario vs contrato).
//
// La funcion se declara con 3 argumentos a proposito: Express identifica los
// error handlers por `fn.length === 4`, asi que un middleware de ruta declarado
// con 4 parametros (req, res, next, valor) seria tratado como manejador de
// errores y nunca correria en una peticion normal. En ambos montajes el valor
// ya esta disponible en `req.params[nombre]`.
//
// Si el valor NO es un UUID se deja pasar sin tocar la DB: los ids numericos
// siguen funcionando (compatibilidad con enlaces viejos, tests y consumidores
// internos del API).
//
// `tabla` nunca viene del request: son constantes definidas en las rutas.
function resolveUuidParam(nombre, tabla, recurso = "Recurso") {
  return async function resolver(req, _res, next) {
    try {
      const actual = req.params[nombre];
      if (!esUuid(actual)) return next();

      const { rows } = await pool.query(
        `SELECT id FROM ${tabla} WHERE uuid = $1 LIMIT 1;`,
        [actual]
      );

      if (!rows.length) return next(new AppError(`${recurso} no existe`, 404));

      // Express 5 expone `req.params` como objeto propio, se puede reescribir.
      req.params[nombre] = String(rows[0].id);
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Resuelve un UUID a ID interno. Para usar directamente en controladores.
// Acepta UUIDs canónicos (prioritario) y mantiene fallback para IDs numéricos
// secuenciales para compatibilidad con tests, mocks y URLs legacy.
async function resolveUuidToId(valor, tabla, recurso = "Recurso") {
  if (esUuid(valor)) {
    const { rows } = await pool.query(
      `SELECT id FROM ${tabla} WHERE uuid = $1 LIMIT 1;`,
      [valor]
    );

    if (!rows.length) {
      throw new AppError(`${recurso} no existe`, 404);
    }

    return String(rows[0].id);
  }

  if (/^\d+$/.test(String(valor))) {
    const { rows } = await pool.query(
      `SELECT id FROM ${tabla} WHERE id = $1 LIMIT 1;`,
      [valor]
    );

    if (!rows.length) {
      throw new AppError(`${recurso} no existe`, 404);
    }

    return String(rows[0].id);
  }

  throw new AppError(`${recurso} debe ser un UUID válido`, 400);
}

module.exports = resolveUuidParam;
module.exports.esUuid = esUuid;
module.exports.resolveUuidToId = resolveUuidToId;
