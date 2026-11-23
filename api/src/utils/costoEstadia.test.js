const test = require("node:test");
const assert = require("node:assert/strict");
const { cobroAlFinal, montoDelCosto } = require("./costoEstadia");

test("la limpieza se cobra una vez al final", () => {
  assert.equal(cobroAlFinal("Limpieza"), true);
  assert.equal(cobroAlFinal("Limpieza del apartamento"), true);
  assert.equal(montoDelCosto("Limpieza", 25, 4), 25);
});

test("el resto de los gastos sigue por noche", () => {
  assert.equal(cobroAlFinal("Estacionamiento"), false);
  assert.equal(montoDelCosto("Estacionamiento", 10, 4), 40);
});
