-- Indice para leer el desglose de una transaccion.
--
-- transacciones_detalles.transaccion_id es una FK, y Postgres NO crea indice en el
-- lado que la referencia. listTransferenciasRealizadas hace un subquery correlacionado
-- por transaccion en cada fila de la lista: sin indice eso es un seq scan de la tabla
-- completa por cada recibo de la pagina. Con 100 recibos por pagina, el costo crece con
-- el total de lineas de desglose que se vayan acumulando.
--
-- Idempotente: se puede correr mas de una vez sobre la misma DB.

CREATE INDEX IF NOT EXISTS idx_transacciones_detalles_transaccion
  ON transacciones_detalles (transaccion_id);
