const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT);

const SQL_DIR = path.join(__dirname, "..", "Saphiro_Inmobiliaria_DB");

const SCHEMA_FILES = [
  "Creacion.sql",
];

const TRIGGER_FILES = [
  "SPs/sp_registro_acciones_ins.sql",
  "SPs/sp_registro_acciones_up.sql",
  "SPs/sp_registro_acciones_del.sql",
  "Triggers/tgr_transacciones_Inmueble_bfr_ins.sql",
  "Triggers/tgr_transacciones_Inmueble_aft_ins.sql",
  "Triggers/tgr_transacciones_comision_aft_up.sql",
  "Triggers/trg_resena_inmueble_aft_ins.sql",
];

async function recreateDatabase() {
  const adminPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: "postgres",
  });

  try {
    await adminPool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid();`,
      [DB_NAME]
    );
    await adminPool.query(`DROP DATABASE IF EXISTS "${DB_NAME}";`);
    await adminPool.query(`CREATE DATABASE "${DB_NAME}";`);
  } finally {
    await adminPool.end();
  }
}

async function runSQLFile(pool, filename) {
  const filePath = path.join(SQL_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[SETUP] Archivo SQL no encontrado, saltando: ${filename}`);
    return;
  }
  let sql = fs.readFileSync(filePath, "utf8");
  sql = sql.replace(/\bTIMESTAMPZ\b/g, "TIMESTAMPTZ");
  sql = sql.replace(/"Guardados"/g, '"guardados"');
  await pool.query(sql);
}

async function seedTestData(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sectores (
      id SERIAL PRIMARY KEY,
      ciudad_id INTEGER NOT NULL,
      nombre character varying(100) NOT NULL
    );
  `);

  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sectores_ciudad_id_fk'
      ) THEN
        ALTER TABLE sectores ADD CONSTRAINT sectores_ciudad_id_fk
          FOREIGN KEY (ciudad_id) REFERENCES ciudades(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await pool.query(`
    INSERT INTO estados (nombre) VALUES ('Distrito Capital'), ('Zulia')
    ON CONFLICT (nombre) DO NOTHING;
  `);

  const { rows: estadoRows } = await pool.query(
    `SELECT id FROM estados WHERE nombre = 'Distrito Capital' LIMIT 1;`
  );
  const estadoId = estadoRows[0]?.id;

  await pool.query(
    `INSERT INTO ciudades (estado_id, nombre) VALUES ($1, 'Caracas')
     ON CONFLICT DO NOTHING;`,
    [estadoId]
  );

  const { rows: ciudadRows } = await pool.query(
    `SELECT id FROM ciudades WHERE nombre = 'Caracas' LIMIT 1;`
  );
  const ciudadId = ciudadRows[0]?.id;

  await pool.query(
    `INSERT INTO sectores (ciudad_id, nombre) VALUES ($1, 'Las Mercedes')
     ON CONFLICT DO NOTHING;`,
    [ciudadId]
  );

  await pool.query(
    `INSERT INTO tipos_inmueble (nombre) VALUES ('Apartamento'), ('Casa'), ('Villa')
     ON CONFLICT DO NOTHING;`
  );

  await pool.query(
    `INSERT INTO caracteristicas (nombre, unidad_medicion)
     VALUES ('Piscina', 'Si/No'), ('Parqueadero', 'Unidades'), ('Habitaciones', 'Unidades')
     ON CONFLICT DO NOTHING;`
  );
}

async function setup() {
  await recreateDatabase();

  const testPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    options: "-c timezone=America/Caracas",
  });

  try {
    for (const file of SCHEMA_FILES) {
      await runSQLFile(testPool, file);
    }
    for (const file of TRIGGER_FILES) {
      await runSQLFile(testPool, file);
    }
    await seedTestData(testPool);
  } finally {
    await testPool.end();
  }
}

async function teardown() {
  const adminPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: "postgres",
  });

  try {
    await adminPool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid();`,
      [DB_NAME]
    );
    await adminPool.query(`DROP DATABASE IF EXISTS "${DB_NAME}";`);
  } finally {
    await adminPool.end();
  }
}

async function cleanTables(pool) {
  const tables = [
    "bitacora_auditoria",
    "notificaciones",
    "resenas",
    "guardados",
    "comisiones",
    "transacciones",
    "caracteristica_inmueble",
    "imagenes",
    "ubicaciones_gps",
    "inmuebles",
    "corredores",
    "usuarios",
  ];

  for (const table of tables) {
    await pool.query(`DELETE FROM ${table};`);
  }
}

module.exports = { setup, teardown, cleanTables };
