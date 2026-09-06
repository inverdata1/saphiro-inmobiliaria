const pool = require("../db/pool");

const DOLAR_OFICIAL_URL = "https://ve.dolarapi.com/v1/dolares/oficial";
const EURO_OFICIAL_URL = "https://ve.dolarapi.com/v1/euros/oficial";
const HISTORICO_DOLAR_URL = "https://ve.dolarapi.com/v1/historicos/dolares/oficial";
const HISTORICO_EURO_URL = "https://ve.dolarapi.com/v1/historicos/euros/oficial";

/**
 * Asegura que la tabla de tasas_cambio exista en la base de datos
 */
async function ensureTableExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasas_cambio (
      id SERIAL PRIMARY KEY,
      bcv_dolar DECIMAL(10, 2) NOT NULL,
      bcv_euro DECIMAL(10, 2) NOT NULL,
      fecha DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Obtiene el registro de tasa de cambio más reciente guardado en la BD
 */
async function getLatestTasa() {
  const { rows } = await pool.query(`
    SELECT id, bcv_dolar, bcv_euro, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, created_at, updated_at
    FROM tasas_cambio
    ORDER BY fecha DESC, id DESC
    LIMIT 1;
  `);
  return rows[0] || null;
}

/**
 * Obtiene el historial de tasas de cambio registradas en la BD
 */
async function getAllTasas(limit = 100) {
  const { rows } = await pool.query(`
    SELECT id, bcv_dolar, bcv_euro, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, created_at, updated_at
    FROM tasas_cambio
    ORDER BY fecha DESC, id DESC
    LIMIT $1;
  `, [limit]);
  return rows;
}

/**
 * Guarda una nueva tasa en la base de datos
 */
async function insertTasa(bcvDolar, bcvEuro, fecha) {
  const { rows } = await pool.query(`
    INSERT INTO tasas_cambio (bcv_dolar, bcv_euro, fecha)
    VALUES ($1, $2, $3)
    RETURNING id, bcv_dolar, bcv_euro, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, created_at;
  `, [Number(bcvDolar).toFixed(2), Number(bcvEuro).toFixed(2), fecha]);
  return rows[0];
}

/**
 * Consulta las tasas actuales (Dólar y Euro oficial BCV) desde DolarApi
 */
async function fetchCurrentRates() {
  const [dolarRes, euroRes] = await Promise.all([
    fetch(DOLAR_OFICIAL_URL),
    fetch(EURO_OFICIAL_URL),
  ]);

  if (!dolarRes.ok) {
    throw new Error(`Error al consultar DolarApi oficial: HTTP ${dolarRes.status}`);
  }
  if (!euroRes.ok) {
    throw new Error(`Error al consultar EuroApi oficial: HTTP ${euroRes.status}`);
  }

  const dolarData = await dolarRes.json();
  const euroData = await euroRes.json();

  const fechaDolar = dolarData.fechaActualizacion
    ? dolarData.fechaActualizacion.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    dolar: Number(dolarData.promedio),
    euro: Number(euroData.promedio),
    fecha: fechaDolar,
  };
}

/**
 * Consulta los datos históricos de DolarApi para sincronizar vacíos o caídas prolongadas
 */
async function fetchHistoricalRates() {
  const [dolarRes, euroRes] = await Promise.all([
    fetch(HISTORICO_DOLAR_URL),
    fetch(HISTORICO_EURO_URL),
  ]);

  if (!dolarRes.ok || !euroRes.ok) {
    throw new Error("No se pudieron obtener los datos históricos de DolarApi");
  }

  const dolarList = await dolarRes.json();
  const euroList = await euroRes.json();

  const euroMap = new Map();
  for (const item of euroList) {
    if (item.fecha && item.promedio) {
      euroMap.set(item.fecha, Number(item.promedio));
    }
  }

  const merged = [];
  for (const item of dolarList) {
    if (item.fecha && item.promedio) {
      const euroVal = euroMap.get(item.fecha);
      if (euroVal !== undefined) {
        merged.push({
          fecha: item.fecha,
          bcv_dolar: Number(item.promedio),
          bcv_euro: euroVal,
        });
      }
    }
  }

  // Ordenar cronológicamente (más antiguo a más nuevo)
  merged.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return merged;
}

/**
 * Compara si dos tasas son idénticas con precisión de 2 decimales
 */
function areRatesEqual(tasaA, tasaB) {
  if (!tasaA || !tasaB) return false;
  const dolarA = Number(tasaA.bcv_dolar !== undefined ? tasaA.bcv_dolar : tasaA.dolar).toFixed(2);
  const dolarB = Number(tasaB.bcv_dolar !== undefined ? tasaB.bcv_dolar : tasaB.dolar).toFixed(2);
  const euroA = Number(tasaA.bcv_euro !== undefined ? tasaA.bcv_euro : tasaA.euro).toFixed(2);
  const euroB = Number(tasaB.bcv_euro !== undefined ? tasaB.bcv_euro : tasaB.euro).toFixed(2);

  return dolarA === dolarB && euroA === euroB;
}

/**
 * Proceso principal de sincronización:
 * 1. Verifica tabla y busca el registro más reciente en la BD.
 * 2. Si faltan días (servidor caído o inicio de BD), rellena los faltantes desde históricos.
 * 3. Consulta la tasa actual y la guarda únicamente si es distinta a la más reciente.
 */
async function syncTasas() {
  console.log("[Tasas Job] Iniciando sincronización de tasas de cambio...");

  let latestInDb = await getLatestTasa();
  let insertedCount = 0;

  try {
    if (!latestInDb) {
      console.log("[Tasas Job] No hay registros previos en la tabla. Realizando carga inicial desde históricos...");
      const historicalRates = await fetchHistoricalRates();

      let lastRecorded = null;
      for (const item of historicalRates) {
        if (!lastRecorded || !areRatesEqual(item, lastRecorded)) {
          await insertTasa(item.bcv_dolar, item.bcv_euro, item.fecha);
          lastRecorded = item;
          insertedCount++;
        }
      }
      latestInDb = await getLatestTasa();
    } else {
      // Verificar si hay huecos en el histórico desde la última fecha registrada
      const historicalRates = await fetchHistoricalRates();
      const pendingHistorical = historicalRates.filter(
        (item) => item.fecha > latestInDb.fecha
      );

      if (pendingHistorical.length > 0) {
        console.log(`[Tasas Job] Se encontraron ${pendingHistorical.length} registros históricos pendientes por sincronizar.`);
        let lastRecorded = latestInDb;
        for (const item of pendingHistorical) {
          if (!areRatesEqual(item, lastRecorded)) {
            await insertTasa(item.bcv_dolar, item.bcv_euro, item.fecha);
            lastRecorded = item;
            insertedCount++;
          }
        }
        latestInDb = await getLatestTasa();
      }
    }
  } catch (histErr) {
    console.warn("[Tasas Job] Advertencia al sincronizar datos históricos:", histErr.message);
  }

  // Ahora verificar la tasa actual del día
  try {
    const currentRate = await fetchCurrentRates();
    latestInDb = await getLatestTasa();

    if (!latestInDb) {
      await insertTasa(currentRate.dolar, currentRate.euro, currentRate.fecha);
      insertedCount++;
      console.log(`[Tasas Job] Tasa inicial insertada: ${currentRate.dolar.toFixed(2)} USD / ${currentRate.euro.toFixed(2)} EUR (Fecha: ${currentRate.fecha})`);
    } else if (areRatesEqual(currentRate, latestInDb)) {
      console.log(`[Tasas Job] Tasa actual (${currentRate.dolar.toFixed(2)} USD / ${currentRate.euro.toFixed(2)} EUR) es idéntica al registro más reciente (${latestInDb.fecha}). No se guarda duplicado.`);
    } else {
      await insertTasa(currentRate.dolar, currentRate.euro, currentRate.fecha);
      insertedCount++;
      console.log(`[Tasas Job] Nueva tasa registrada con éxito: ${currentRate.dolar.toFixed(2)} USD / ${currentRate.euro.toFixed(2)} EUR (Fecha: ${currentRate.fecha})`);
    }
  } catch (currErr) {
    console.error("[Tasas Job] Error al consultar/guardar tasa actual de DolarApi:", currErr.message);
  }

  console.log(`[Tasas Job] Sincronización completada. Registros agregados: ${insertedCount}.`);
  return { success: true, insertedCount, latest: await getLatestTasa() };
}

module.exports = {
  getLatestTasa,
  getAllTasas,
  syncTasas,
};
