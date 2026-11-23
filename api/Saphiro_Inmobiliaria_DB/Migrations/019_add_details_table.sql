CREATE TABLE transacciones_detalles (
  id SERIAL PRIMARY KEY,
  transaccion_id INTEGER NOT NULL,
  concepto VARCHAR(50) NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_transacciones_detalles_transaccion 
    FOREIGN KEY (transaccion_id) 
    REFERENCES transacciones (id) 
    ON DELETE CASCADE
);

CREATE TABLE transaccion_mensualidades (
  id SERIAL PRIMARY KEY,
  transaccion_id INTEGER NOT NULL UNIQUE REFERENCES transacciones(id),
  mensualidad_id INTEGER NOT NULL REFERENCES mensualidades(id)
);

ALTER TABLE mensualidades 
ADD COLUMN monto_meta NUMERIC(10,2) NOT NULL,
ADD COLUMN monto_pagado NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN estado VARCHAR(20) CHECK (estado IN ('pendiente', 'pagado_parcial', 'pagado')) DEFAULT 'pendiente';

ALTER TABLE mensualidades DROP COLUMN transaccion_id;
ALTER TABLE mensualidades DROP COLUMN monto;