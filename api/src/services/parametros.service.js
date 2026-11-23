const pool = require("../db/pool");

async function ensure() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parametros_portal (
      id integer PRIMARY KEY DEFAULT 1,
      precio_min_venta numeric,
      precio_max_venta numeric,
      precio_min_alquiler numeric,
      precio_max_alquiler numeric,
      moneda varchar(8) DEFAULT 'USD',
      updated_at timestamptz DEFAULT now()
    );
  `);
  await pool.query(`
    INSERT INTO parametros_portal (id, precio_min_venta, precio_max_venta, precio_min_alquiler, precio_max_alquiler, moneda)
    VALUES (1, 0, 7000, 0, 3500, 'USD')
    ON CONFLICT (id) DO NOTHING;
  `);
  await pool.query(`ALTER TABLE imagenes ADD COLUMN IF NOT EXISTS tipo_media varchar(20) DEFAULT 'imagen'`);
  await pool.query(`ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS estatus varchar(40) DEFAULT 'disponible'`);
  await pool.query(`UPDATE inmuebles SET estatus = 'disponible' WHERE estatus IS NULL`);
}

exports.getParametros = async () => {
  await ensure();
  const { rows } = await pool.query("SELECT * FROM parametros_portal WHERE id = 1");
  return rows[0];
};

exports.updateParametros = async (body) => {
  await ensure();
  const fields = ["precio_min_venta", "precio_max_venta", "precio_min_alquiler", "precio_max_alquiler", "moneda"];
  const sets = [];
  const vals = [];
  for (const f of fields) {
    if (body[f] === undefined || body[f] === "") continue;
    vals.push(f === "moneda" ? String(body[f]) : Number(body[f]));
    sets.push(`${f} = $${vals.length}`);
  }
  if (!sets.length) return exports.getParametros();
  vals.push(1);
  await pool.query(
    `UPDATE parametros_portal SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`,
    vals
  );
  return exports.getParametros();
};
