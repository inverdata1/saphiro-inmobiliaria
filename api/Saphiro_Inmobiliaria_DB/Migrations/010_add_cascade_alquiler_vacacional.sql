-- El PUT de inmuebles borra y recrea alquiler_vacacional.
-- Las tablas hijas deben eliminarse en cascada al borrar el padre.
ALTER TABLE mascotas_alquiler_vacacional
  DROP CONSTRAINT mascotas_alquiler_vacacional_alquiler_vacacional_id_fkey,
  ADD CONSTRAINT mascotas_alquiler_vacacional_alquiler_vacacional_id_fkey
    FOREIGN KEY (alquiler_vacacional_id) REFERENCES alquiler_vacacional(id)
    ON DELETE CASCADE;

ALTER TABLE alquiler_vacacional_costos_adicionales
  DROP CONSTRAINT alquiler_vacacional_costos_adiciona_alquiler_vacacional_id_fkey,
  ADD CONSTRAINT alquiler_vacacional_costos_adiciona_alquiler_vacacional_id_fkey
    FOREIGN KEY (alquiler_vacacional_id) REFERENCES alquiler_vacacional(id)
    ON DELETE CASCADE;