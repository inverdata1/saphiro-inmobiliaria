const { Pool } = require("pg");

function must(name) {
  const v = process.env[name];
  if (v === undefined || v === null || v === "") {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

const pool = new Pool({
  host: must("DB_HOST"),
  port: Number(must("DB_PORT")),
  user: must("DB_USER"),
  password: String(must("DB_PASSWORD")), // ✅ fuerza string
  database: must("DB_NAME"),
  options: "-c timezone=America/Caracas",
});

module.exports = pool;