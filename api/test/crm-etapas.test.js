const test = require("node:test");
const assert = require("node:assert/strict");
const { ETAPAS, etapaValida } = require("../src/services/crm.service");

test("el pipeline solo acepta las cinco etapas pedidas", () => {
  assert.deepEqual(ETAPAS, ["nuevo", "contactado", "visita", "negociacion", "cerrado"]);
  assert.equal(etapaValida("visita"), true);
  assert.equal(etapaValida("ganado"), false);
});
