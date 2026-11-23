require("dotenv").config({ path: require("path").join(__dirname, ".env.test") });
const { setup } = require("./__tests__/setup");

module.exports = async function globalSetup() {
  console.log("\n[TEST] Configurando base de datos de prueba...");
  await setup();
  console.log("[TEST] Base de datos de prueba lista.\n");
};
