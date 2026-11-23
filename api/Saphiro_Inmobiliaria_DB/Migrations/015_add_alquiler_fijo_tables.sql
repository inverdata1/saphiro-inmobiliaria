-- Contrato de alquiler fijo por usuario + cuotas (mensualidades).
--
-- Idempotente: se puede correr sobre una DB donde la version previa ya se aplicó
-- (tablas creadas con el typo de columna "alquiler fijo_usuario_id").

CREATE TABLE IF NOT EXISTS "alquiler_fijo_usuario" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" INTEGER NOT NULL,
  "alquiler_fijo_id" INTEGER NOT NULL,
  "precio_mensualidad" DECIMAL(10,2) NOT NULL,
  "cantidad_meses" INTEGER NOT NULL,
  "moneda" VARCHAR(5) NOT NULL,
  "fecha_inicio" TIMESTAMPTZ NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "mensualidades" (
  "id" SERIAL PRIMARY KEY,
  "alquiler_fijo_usuario_id" INTEGER NOT NULL,
  "transaccion_id" INTEGER UNIQUE NOT NULL,
  "numero_cuota" INTEGER NOT NULL,
  "periodo_mes" INTEGER NOT NULL,
  "periodo_anio" INTEGER NOT NULL
);

-- Corrección del typo original: la FK nació sobre la columna
-- "alquiler fijo_usuario_id" (con espacio en lugar de guion bajo).
DO $$
BEGIN
  IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mensualidades' AND column_name = 'alquiler fijo_usuario_id'
      )
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mensualidades' AND column_name = 'alquiler_fijo_usuario_id'
      ) THEN
    ALTER TABLE "mensualidades"
      RENAME COLUMN "alquiler fijo_usuario_id" TO "alquiler_fijo_usuario_id";
  END IF;

  -- "active" sin DEFAULT en la version previa: el INSERT debe poder omitirlo.
  IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'alquiler_fijo_usuario' AND column_name = 'active'
          AND column_default IS NULL
      ) THEN
    ALTER TABLE "alquiler_fijo_usuario" ALTER COLUMN "active" SET DEFAULT TRUE;
  END IF;

  -- El constraint conserva el nombre viejo tras el RENAME COLUMN.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mensualidades_alquiler fijo_usuario_id_fkey') THEN
    ALTER TABLE "mensualidades"
      RENAME CONSTRAINT "mensualidades_alquiler fijo_usuario_id_fkey"
      TO "mensualidades_alquiler_fijo_usuario_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_alquiler_fijo_usuario_alquiler_fijo') THEN
    ALTER TABLE "alquiler_fijo_usuario"
      ADD CONSTRAINT "fk_alquiler_fijo_usuario_alquiler_fijo"
      FOREIGN KEY ("alquiler_fijo_id") REFERENCES "alquiler_fijo" ("id")
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_alquiler_fijo_usuario_usuario') THEN
    ALTER TABLE "alquiler_fijo_usuario"
      ADD CONSTRAINT "fk_alquiler_fijo_usuario_usuario"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id")
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_mensualidades_alquiler_fijo_usuario') THEN
    ALTER TABLE "mensualidades"
      ADD CONSTRAINT "fk_mensualidades_alquiler_fijo_usuario"
      FOREIGN KEY ("alquiler_fijo_usuario_id") REFERENCES "alquiler_fijo_usuario" ("id")
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_mensualidades_transaccion') THEN
    ALTER TABLE "mensualidades"
      ADD CONSTRAINT "fk_mensualidades_transaccion"
      FOREIGN KEY ("transaccion_id") REFERENCES "transacciones" ("id")
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;
