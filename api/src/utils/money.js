const Decimal = require("decimal.js");

// Todos los importes del sistema son NUMERIC(x,2) en la base. Antes la aritmética se hacía
// con Number y se "corregía" con `Math.round(x * 100) / 100`, que arrastra el error de
// IEEE-754 (0.1 + 0.2 = 0.30000000000000004) y redondea según el error acumulado, no según
// el valor real del importe. decimal.js opera en base 10: los centavos son exactos y el
// redondeo es determinista.
//
// ROUND_HALF_UP (2.345 -> 2.35) es el criterio contable y lo que el `Math.round` anterior
// intentaba hacer; ROUND_HALF_EVEN, el default de la librería, repartiría los .5 hacia el
// par y cambiaría importes ya cobrados.
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

const CERO = new Decimal(0);

// Convierte a Decimal tolerando null/undefined/''/valores no numéricos, igual que el
// `Number(x) || 0` que reemplaza (basura -> 0 en vez de reventar el request).
//
// OJO: NUNCA pasar un Decimal directo como parámetro a `pg`. El driver no sabe
// serializarlo y lo manda como JSON con comillas ("\"100.50\""), que Postgres rechaza para
// una columna NUMERIC. Para eso están `toSql` (parámetro SQL) y `toNumber` (JSON/respuesta).
function D(valor) {
  if (valor instanceof Decimal) return valor;
  if (valor === null || valor === undefined || valor === "") return CERO;
  try {
    const d = new Decimal(valor);
    return d.isFinite() ? d : CERO;
  } catch {
    return CERO;
  }
}

// Redondeo monetario: 2 decimales, el formato de las columnas NUMERIC(x,2).
function round2(valor) {
  return D(valor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// Importe listo para un parámetro NUMERIC de `pg`, y para textos/logs con los 2 decimales
// visibles ("1230.50" en vez de "1230.5").
function toSql(valor) {
  return round2(valor).toFixed(2);
}

// Importe como Number, para respuestas JSON y para el payload JSONB de transacciones_detalles.
function toNumber(valor) {
  return round2(valor).toNumber();
}

// Suma de importes; `extractor` permite sumar una propiedad (por ejemplo c.monto).
function sum(items, extractor) {
  return (items || []).reduce(
    (acc, item) => acc.plus(D(extractor ? extractor(item) : item)),
    CERO
  );
}

module.exports = { Decimal, D, round2, toSql, toNumber, sum, CERO };
