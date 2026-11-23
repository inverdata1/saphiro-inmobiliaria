-- Identificadores publicos (UUID) para inmuebles y usuarios.
--
-- Por que una columna nueva y no cambiar la PK:
--   * `id` (SERIAL) sigue siendo la PK y la columna que usan todas las FKs
--     (transacciones, imagenes, guardados, resenas, contratos, notificaciones...).
--     Cambiar la PK a UUID obligaria a migrar y reescribir 20+ tablas y todos los
--     servicios, sin ninguna ganancia funcional.
--   * `uuid` es el identificador que se expone en las URLs. El backend lo resuelve
--     a `id` (middleware `publicId`) antes de tocar la DB, asi que el resto del
--     codigo sigue trabajando con enteros.
--
-- `gen_random_uuid()` es nativa desde PostgreSQL 13: no requiere la extension
-- pgcrypto. El DEFAULT se evalua por fila al agregar la columna, por lo que las
-- filas existentes quedan con UUIDs distintos sin backfill aparte.
--
-- Idempotente: se puede correr mas de una vez sobre la misma DB.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE inmuebles
  ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

-- El lookup publico es siempre "WHERE uuid = $1"; el indice unico lo cubre y
-- garantiza que no haya dos filas con el mismo identificador expuesto.
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_uuid ON usuarios (uuid);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inmuebles_uuid ON inmuebles (uuid);

COMMENT ON COLUMN usuarios.uuid IS 'Identificador publico (URLs). No usar para FKs: la PK interna sigue siendo id.';
COMMENT ON COLUMN inmuebles.uuid IS 'Identificador publico (URLs). No usar para FKs: la PK interna sigue siendo id.';
