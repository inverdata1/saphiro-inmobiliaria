function redondear(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function montoACobrar({ total, precioNoche, nochesEstadia, modo, noches, porcentaje }) {
  if (modo === "noches") {
    const n = Number(noches);
    const max = Number(nochesEstadia);
    if (!Number.isInteger(n) || n < 1 || n > max) {
      const err = new Error("Elige entre 1 y las noches de la estadía");
      err.code = "NOCHES";
      throw err;
    }
    return { monto: redondear(Number(precioNoche) * n), noches: n, modo: "noches" };
  }
  const p = Number(porcentaje);
  const pct = Number.isFinite(p) && p >= 0 && p <= 100 ? p : 50;
  return { monto: redondear(Number(total) * pct / 100), noches: null, modo: "mitad", porcentaje: pct };
}

module.exports = { montoACobrar };
