function cobroAlFinal(nombre) {
  return /limpieza|dep[oó]sito|garant[ií]a|seguro de da/i.test(String(nombre || ""));
}

function reembolsable(nombre) {
  return /dep[oó]sito|garant[ií]a|seguro de da/i.test(String(nombre || ""));
}

function montoDelCosto(nombre, monto, noches) {
  const veces = cobroAlFinal(nombre) ? 1 : Number(noches) || 0;
  return Math.round(veces * Number(monto || 0) * 100) / 100;
}

module.exports = { cobroAlFinal, reembolsable, montoDelCosto };
