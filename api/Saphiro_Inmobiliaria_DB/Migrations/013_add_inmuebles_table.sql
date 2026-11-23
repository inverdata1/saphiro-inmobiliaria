ALTER TABLE inmuebles ADD COLUMN area_construccion_m2 numeric(10,2) DEFAULT 0;
ALTER TABLE inmuebles ADD COLUMN terminos_y_condiciones TEXT DEFAULT '';
ALTER TABLE alquiler_vacacional ADD COLUMN cantidad_mascotas_permitidas int DEFAULT 0;

ALTER TABLE inmuebles ALTER COLUMN area_construccion_m2 SET NOT NULL;
ALTER TABLE alquiler_vacacional ALTER COLUMN cantidad_mascotas_permitidas SET NOT NULL;