const cron = require("node-cron");
const { syncTasas } = require("../services/tasasCambio.service");

/**
 * Inicializa el Cron Job para la sincronización de tasas de cambio del BCV (Dólar y Euro).
 * Horario: Lunes a Viernes a las 09:00 AM (Excepto sábados y domingos).
 * Cron Expression: '0 9 * * 1-5'
 */
function initTasasJob() {
  console.log("[Tasas Job] Inicializando cron job de tasas de cambio (09:00 AM, Lun-Vie)...");

  // Programar la ejecución recurrente
  cron.schedule(
    "0 9 * * 1-5",
    async () => {
      console.log(`[Tasas Job] [${new Date().toISOString()}] Ejecutando sincronización programada de tasas de cambio...`);
      try {
        await syncTasas();
      } catch (err) {
        console.error("[Tasas Job] Error durante la ejecución del job programado:", err);
      }
    },
    {
      scheduled: true,
      timezone: "America/Caracas",
    }
  );

  // Ejecutar inmediatamente al arrancar el servidor para verificar si hubo caídas prolongadas o falta de datos
  setTimeout(async () => {
    try {
      console.log("[Tasas Job] Comprobando sincronización inicial de tasas de cambio...");
      await syncTasas();
    } catch (err) {
      console.error("[Tasas Job] Error en comprobación inicial de tasas:", err.message);
    }
  }, 3000);
}

module.exports = {
  initTasasJob,
};
