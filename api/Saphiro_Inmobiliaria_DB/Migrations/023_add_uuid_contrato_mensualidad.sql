-- Identificadores publicos (UUID) para contratos y mensualidades.
--
-- Mismo esquema que 022: `id` (SERIAL) sigue siendo la PK y la columna que usan
-- las FKs (transaccion_mensualidades, etc.); `uuid` es solo el identificador que
-- se expone en las URLs. El backend lo resuelve a `id` con el middleware
-- `publicId` antes de tocar la DB.
--
-- Cubre las URLs:
--   * /mensualidades/:uuid                 (contrato)
--   * /rentas-contratadas/:uuid/mensualidades
--   * /inmuebles-alquilados/:uuid/mensualidades
--   * /pagar-mensualidad/:uuid?cuota=<uuid de mensualidad>
--
-- `gen_random_uuid()` es nativa desde PostgreSQL 13: no requiere pgcrypto.
--
-- Idempotente: se puede correr mas de una vez sobre la misma DB.

ALTER TABLE contrato
  ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE mensualidades
  ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

-- El lookup publico es siempre "WHERE uuid = $1"; el indice unico lo cubre y
-- garantiza que no haya dos filas con el mismo identificador expuesto.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_uuid ON contrato (uuid);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mensualidades_uuid ON mensualidades (uuid);

COMMENT ON COLUMN contrato.uuid IS 'Identificador publico (URLs). No usar para FKs: la PK interna sigue siendo id.';
COMMENT ON COLUMN mensualidades.uuid IS 'Identificador publico (URLs). No usar para FKs: la PK interna sigue siendo id.';
