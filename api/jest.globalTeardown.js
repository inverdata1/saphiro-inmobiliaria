require("dotenv").config({ path: require("path").join(__dirname, ".env.test") });
const { teardown } = require("./__tests__/setup");

module.exports = async function globalTeardown() {
  console.log("\n[TEST] Limpiando base de datos de prueba...");
  await teardown();
  console.log("[TEST] Limpieza completada.\n");
};
