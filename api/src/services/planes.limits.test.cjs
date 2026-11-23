const assert = require("assert");
const { cupoDe } = require("./planes.cupo.js");

assert.deepEqual(cupoDe(null), { plan: "basico", limite: 3, extra: 0 });
assert.deepEqual(cupoDe({ plan_codigo: "pro", plan_pagado: false }), { plan: "basico", limite: 3, extra: 0 });
assert.deepEqual(cupoDe({ plan_codigo: "pro", plan_pagado: true, publicaciones_extra: 2 }), { plan: "pro", limite: 17, extra: 2 });
assert.deepEqual(cupoDe({ plan_codigo: "pyme", plan_pagado: true }), { plan: "pyme", limite: 50, extra: 0 });
assert.deepEqual(cupoDe({ plan_codigo: "enterprise", plan_pagado: true }), { plan: "enterprise", limite: null, extra: 0 });
console.log("planes ok");
