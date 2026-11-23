CREATE TABLE "nros_telefono" (
  "id" SERIAL PRIMARY KEY,
  "corredor_id" integer NOT NULL,
  "nro_telefono" character varying(50) NOT NULL,
  "codigo_pais" character varying(2)
);

ALTER TABLE "nros_telefono" ADD FOREIGN KEY ("corredor_id") REFERENCES "corredores" ("id") DEFERRABLE INITIALLY IMMEDIATE;

INSERT INTO "nros_telefono" ("corredor_id", "nro_telefono")
SELECT c."id", c."telefono"
FROM "corredores" c
WHERE c."telefono" IS NOT NULL
  AND BTRIM(c."telefono") <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "nros_telefono" nt
    WHERE nt."corredor_id" = c."id"
      AND nt."nro_telefono" = c."telefono"
  );

-- Llenar registros existentes antes de imponer NOT NULL
UPDATE "nros_telefono" SET "codigo_pais" = 'VE' WHERE "codigo_pais" IS NULL;

ALTER TABLE "nros_telefono" ALTER COLUMN "codigo_pais" SET NOT NULL;

ALTER TABLE corredores DROP COLUMN telefono;
