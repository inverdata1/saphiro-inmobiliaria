ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS numero_factura character varying(20) DEFAULT NULL;

WITH pendientes AS (
  SELECT
    t.id,
    EXTRACT(YEAR FROM t.fecha_transaccion)::int AS anio,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM t.fecha_transaccion)
      ORDER BY t.fecha_transaccion, t.id
    ) AS rn
  FROM transacciones t
  WHERE t.numero_factura IS NULL
),
existentes AS (
  SELECT EXTRACT(YEAR FROM x.fecha_transaccion)::int AS anio, COUNT(*) AS cnt
  FROM transacciones x
  WHERE x.numero_factura IS NOT NULL
  GROUP BY 1
)
UPDATE transacciones t
SET numero_factura = 'FAC-' || p.anio || '-' || LPAD((COALESCE(e.cnt, 0) + p.rn)::text, 5, '0')
FROM pendientes p
LEFT JOIN existentes e ON e.anio = p.anio
WHERE p.id = t.id;

ALTER TABLE transacciones ALTER COLUMN numero_factura SET NOT NULL;