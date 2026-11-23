CREATE TABLE "alquiler_fijo"(
    "id" SERIAL PRIMARY KEY,
    "inmueble_id" INTEGER NOT NULL,
    "precio_mes" NUMERIC(10,2) NOT NULL,
    "cantidad_meses" INTEGER NOT NULL
);

ALTER TABLE "alquiler_fijo" 
ADD CONSTRAINT "fk_alquiler_fijo_inmueble" 
FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles"("id") ON DELETE CASCADE;