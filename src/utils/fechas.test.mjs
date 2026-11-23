import assert from "node:assert/strict";
import { claseDiaReserva, diaSiguiente, nochesEntre } from "./fechas.js";
import { fechasOcupadas } from "./reservas.js";

assert.equal(diaSiguiente("2026-10-30"), "2026-10-31");
assert.equal(diaSiguiente("2026-10-31"), "2026-11-01");
assert.equal(diaSiguiente("2026-12-31"), "2027-01-01");
assert.equal(nochesEntre("2026-10-30", "2026-10-31"), 1);
assert.equal(nochesEntre("2026-10-20", "2026-10-23"), 3);
assert.equal(nochesEntre("", "2026-10-23"), 0);

assert.equal(claseDiaReserva("2026-10-20", "2026-10-20", "2026-10-23"), "fc-dia-entrada");
assert.equal(claseDiaReserva("2026-10-21", "2026-10-20", "2026-10-23"), "fc-dia-rango");
assert.equal(claseDiaReserva("2026-10-22", "2026-10-20", "2026-10-23"), "fc-dia-rango");
assert.equal(claseDiaReserva("2026-10-23", "2026-10-20", "2026-10-23"), "fc-dia-salida");
assert.equal(claseDiaReserva("2026-10-19", "2026-10-20", "2026-10-23"), "");
assert.equal(claseDiaReserva("2026-10-20", "2026-10-20", ""), "fc-dia-entrada");

const ocupadas = fechasOcupadas([
  { fecha_entrada: "2026-10-20", fecha_salida: "2026-10-23" },
]);
assert.deepEqual([...ocupadas].sort(), ["2026-10-20", "2026-10-21", "2026-10-22"]);
assert.equal(ocupadas.has("2026-10-19"), false);
assert.equal(ocupadas.has("2026-10-23"), false);

const utcShift = new Date("2026-10-30T00:00:00.000Z");
const viejo = new Date(utcShift.getTime() + 86400000);
const viejoLocal = `${viejo.getFullYear()}-${String(viejo.getMonth() + 1).padStart(2, "0")}-${String(viejo.getDate()).padStart(2, "0")}`;
if (viejoLocal !== "2026-10-31") {
  assert.notEqual(diaSiguiente("2026-10-30"), viejoLocal);
}

console.log("fechas ok");
