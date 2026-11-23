CREATE TABLE "mascotas" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(50) NOT NULL
);

CREATE TABLE "reservas_mascotas" (
  "id" SERIAL PRIMARY KEY,
  "mascota_id" integer NOT NULL,
  "reserva_id" integer NOT NULL
);

CREATE TABLE "mascotas_alquiler_vacacional" (
  "id" SERIAL PRIMARY KEY,
  "mascota_id" integer NOT NULL,
  "alquiler_vacacional_id" integer NOT NULL
);

ALTER TABLE "reservas_mascotas" ADD FOREIGN KEY ("reserva_id") REFERENCES "reservas_vacacionales" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reservas_mascotas" ADD FOREIGN KEY ("mascota_id") REFERENCES "mascotas" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "mascotas_alquiler_vacacional" ADD FOREIGN KEY ("alquiler_vacacional_id") REFERENCES "alquiler_vacacional" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "mascotas_alquiler_vacacional" ADD FOREIGN KEY ("mascota_id") REFERENCES "mascotas" ("id") DEFERRABLE INITIALLY IMMEDIATE;

INSERT INTO "mascotas" ("nombre") VALUES
  ('Perro'),
  ('Gato'),
  ('Pájaro'),
  ('Pez'),
  ('Conejo'),
  ('Hámster'),
  ('Tortuga'),
  ('Iguana'),
  ('Serpiente'),
  ('Gecko'),
  ('Camaleón'),
  ('Lagartija');
