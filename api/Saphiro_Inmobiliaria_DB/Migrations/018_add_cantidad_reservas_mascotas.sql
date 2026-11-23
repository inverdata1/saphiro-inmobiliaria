-- Cantidad de mascotas por tipo en una reserva.
--
-- Antes reservas_mascotas era (id, mascota_id, reserva_id): una fila por tipo de mascota,
-- sin forma de expresar "2 perros". El frontend ya enviaba la cantidad pero se descartaba,
-- y la tabla no tenia donde guardarla.
--
-- DEFAULT 1: las filas existentes significan "1 de este tipo", que es lo que_utf8 venia
-- implicando. Asi el backfill es implicito y las consultas old-style siguen dando 1.
--
-- Idempotente: se puede correr mas de una vez sobre la misma DB.

ALTER TABLE "reservas_mascotas"
  ADD COLUMN IF NOT EXISTS "cantidad" INTEGER NOT NULL DEFAULT 1;

-- CHECK con nombre: si la columna existia sin restriccion, se agrega la que falta.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_reservas_mascotas_cantidad'
  ) THEN
    ALTER TABLE "reservas_mascotas"
      ADD CONSTRAINT "chk_reservas_mascotas_cantidad"
      CHECK ("cantidad" > 0);
  END IF;
END $$;

-- La consulta natural es "las mascotas de esta reserva": cubre el filtro por reserva_id.
CREATE INDEX IF NOT EXISTS idx_reservas_mascotas_reserva
  ON reservas_mascotas (reserva_id);