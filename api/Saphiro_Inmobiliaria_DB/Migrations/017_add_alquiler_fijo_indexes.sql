-- Indices para el calculo de estatus y el precio efectivo de los alquileres fijos.
--
-- El estatus de un alquiler_fijo ahora exige un contrato activo
-- (alquiler_fijo_usuario.active = TRUE), lo que agrega un EXISTS correlacionado por fila.
-- Postgres no indexa el lado referenciante de una FK, asi que ambas tablas se escanean
-- completas por cada inmueble evaluado.
--
-- Idempotente: se puede correr mas de una vez sobre la misma DB.

CREATE INDEX IF NOT EXISTS idx_alquiler_fijo_inmueble
  ON alquiler_fijo (inmueble_id);

-- Parcial: el EXISTS solo pregunta por contratos activos, asi que los historicos
-- (active = FALSE) no necesitan estar en el indice.
CREATE INDEX IF NOT EXISTS idx_alquiler_fijo_usuario_activo
  ON alquiler_fijo_usuario (alquiler_fijo_id)
  WHERE active;