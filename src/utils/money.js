// Formateo de importes por moneda (USD/EUR/BS) sin dependecer del contexto de la tabla.

// Importe sin el codigo de moneda: la cabecera de la tabla ya lo dice.
export function fmtImporte(moneda, v) {
  const n = Number(v || 0);
  if (moneda === "BS") return n.toLocaleString("es-VE", { minimumFractionDigits: 2 });
  if (moneda === "EUR") return `\u20AC${n.toFixed(2)}`;
  return `$${n.toFixed(2)}`;
}

// Con el codigo, para los totales.
export function fmtTotal(moneda, v) {
  return `${fmtImporte(moneda, v)} ${moneda}`;
}
