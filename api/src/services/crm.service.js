const pool = require("../db/pool");
const AppError = require("../utils/AppError");

const ETAPAS = ["nuevo", "contactado", "visita", "negociacion", "cerrado"];

function etapaValida(value) {
  return ETAPAS.includes(String(value || ""));
}

async function alcance(user) {
  if (!user) throw new AppError("No autorizado", 401);
  if (user.rol === "admin") return { corredorId: null };
  if (user.rol !== "corredor") throw new AppError("No autorizado", 403);
  const { rows } = await pool.query("SELECT id FROM corredores WHERE usuario_id = $1", [Number(user.id)]);
  if (!rows.length) throw new AppError("No tienes ficha de corredor", 403);
  return { corredorId: rows[0].id };
}

exports.ETAPAS = ETAPAS;
exports.etapaValida = etapaValida;

exports.resumen = async (user) => {
  const { corredorId } = await alcance(user);
  const params = corredorId == null ? [] : [corredorId];
  const inmueble = corredorId == null ? "TRUE" : "i.corredor_id = $1";
  const lead = corredorId == null ? "TRUE" : "l.corredor_id = $1";
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM inmuebles i WHERE i.deleted_at IS NULL AND i.estatus = 'disponible' AND ${inmueble}) AS cartera,
       (SELECT COUNT(*)::int FROM inmuebles i WHERE i.deleted_at IS NULL AND i.destacado_hasta > NOW() AND ${inmueble}) AS destacados,
       (SELECT COUNT(*)::int FROM leads l WHERE COALESCE(l.etapa, 'nuevo') <> 'cerrado' AND ${lead}) AS leads_activos,
       (SELECT COUNT(*)::int FROM leads l WHERE l.creado_en::date = CURRENT_DATE AND ${lead}) AS leads_hoy,
       (SELECT COUNT(*)::int FROM transacciones t JOIN inmuebles i ON i.id = t.inmueble_id
         WHERE t.estatus_pago = 'pagado' AND t.fecha_transaccion >= date_trunc('month', NOW()) AND ${inmueble}) AS ventas_mes,
       (SELECT COALESCE(SUM(t.monto_total), 0) FROM transacciones t JOIN inmuebles i ON i.id = t.inmueble_id
         WHERE t.estatus_pago = 'pagado' AND t.moneda = 'USD' AND t.fecha_transaccion >= date_trunc('month', NOW()) AND ${inmueble}) AS monto_usd_mes,
       (SELECT COUNT(*)::int FROM reservas_vacacionales rv
         JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
         JOIN inmuebles i ON i.id = av.inmueble_id
         LEFT JOIN transacciones t ON t.id = rv.transaccion_id
         WHERE rv.fecha_entrada >= CURRENT_DATE AND rv.fecha_entrada < CURRENT_DATE + 7
           AND (t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado') AND ${inmueble}) AS visitas_semana,
       (SELECT COUNT(*)::int FROM reservas_vacacionales rv
         JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
         JOIN inmuebles i ON i.id = av.inmueble_id
         LEFT JOIN transacciones t ON t.id = rv.transaccion_id
         WHERE rv.fecha_entrada = CURRENT_DATE
           AND (t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado') AND ${inmueble}) AS visitas_hoy`,
    params
  );
  const row = rows[0];
  const meses = await pool.query(
    `SELECT EXTRACT(MONTH FROM t.fecha_transaccion)::int AS mes,
            COALESCE(SUM(t.monto_total), 0) AS monto
       FROM transacciones t
       JOIN inmuebles i ON i.id = t.inmueble_id
      WHERE t.estatus_pago = 'pagado' AND t.moneda = 'USD'
        AND t.fecha_transaccion >= date_trunc('year', NOW())
        AND ${inmueble}
      GROUP BY 1`,
    params
  );
  const serie = Array.from({ length: 12 }, () => 0);
  for (const item of meses.rows) serie[Number(item.mes) - 1] = Number(item.monto);
  return {
    cartera: row.cartera,
    destacados: row.destacados,
    leads_activos: row.leads_activos,
    leads_hoy: row.leads_hoy,
    ventas_mes: row.ventas_mes,
    monto_usd_mes: Number(row.monto_usd_mes || 0).toFixed(2),
    visitas_semana: row.visitas_semana,
    visitas_hoy: row.visitas_hoy,
    meses: serie.map((n) => n.toFixed(2)),
  };
};

exports.listarLeads = async (user) => {
  const { corredorId } = await alcance(user);
  const where = corredorId == null ? "" : "WHERE l.corredor_id = $1";
  const { rows } = await pool.query(
    `SELECT l.id, COALESCE(l.etapa, 'nuevo') AS etapa, l.tipo, l.creado_en,
            NULLIF(TRIM(COALESCE(l.nombre, '')), '') AS nombre,
            NULLIF(TRIM(COALESCE(l.telefono, '')), '') AS telefono,
            NULLIF(TRIM(COALESCE(l.email, '')), '') AS email,
            l.valor, i.titulo AS inmueble, i.id AS inmueble_id
       FROM leads l
       LEFT JOIN inmuebles i ON i.id = l.inmueble_id
       ${where}
      ORDER BY l.creado_en DESC
      LIMIT 200`,
    corredorId == null ? [] : [corredorId]
  );
  return rows;
};

exports.crearLead = async (user, body) => {
  const { corredorId } = await alcance(user);
  const inmuebleId = Number(body?.inmueble_id);
  if (!Number.isInteger(inmuebleId)) throw new AppError("Selecciona un inmueble", 400);
  const nombre = String(body?.nombre || "").trim().slice(0, 120);
  if (!nombre) throw new AppError("El nombre del lead es obligatorio", 400);
  const etapa = etapaValida(body?.etapa) ? body.etapa : "nuevo";
  const dueno = await pool.query(
    "SELECT corredor_id FROM inmuebles WHERE id = $1 AND deleted_at IS NULL",
    [inmuebleId]
  );
  if (!dueno.rows.length) throw new AppError("El inmueble no existe", 404);
  if (corredorId != null && Number(dueno.rows[0].corredor_id) !== Number(corredorId)) {
    throw new AppError("Ese inmueble no es tuyo", 403);
  }
  const { rows } = await pool.query(
    `INSERT INTO leads (inmueble_id, corredor_id, tipo, nombre, telefono, email, etapa, valor)
     VALUES ($1, $2, 'crm', $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      inmuebleId,
      dueno.rows[0].corredor_id,
      nombre,
      String(body?.telefono || "").trim().slice(0, 30) || null,
      String(body?.email || "").trim().slice(0, 120) || null,
      etapa,
      body?.valor === "" || body?.valor == null || Number.isNaN(Number(body.valor)) ? null : Number(body.valor),
    ]
  );
  return rows[0];
};

exports.moverLead = async (user, id, etapa) => {
  if (!etapaValida(etapa)) throw new AppError("Etapa inválida", 400);
  const { corredorId } = await alcance(user);
  const params = [etapa, Number(id)];
  let where = "id = $2";
  if (corredorId != null) {
    params.push(corredorId);
    where += " AND corredor_id = $3";
  }
  const { rows } = await pool.query(
    `UPDATE leads SET etapa = $1 WHERE ${where} RETURNING id, etapa`,
    params
  );
  if (!rows.length) throw new AppError("Lead no encontrado", 404);
  return rows[0];
};

exports.propiedades = async (user) => {
  const { corredorId } = await alcance(user);
  const where = corredorId == null ? "" : "AND i.corredor_id = $1";
  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, i.estado_inmueble, i.precio, i.moneda, i.estatus,
            c.nombre AS ciudad
       FROM inmuebles i
       LEFT JOIN ciudades c ON c.id = i.ciudad_id
      WHERE i.deleted_at IS NULL ${where}
      ORDER BY i.id DESC
      LIMIT 100`,
    corredorId == null ? [] : [corredorId]
  );
  return rows;
};

exports.clientes = async (user) => {
  const { corredorId } = await alcance(user);
  const where = corredorId == null ? "" : "WHERE i.corredor_id = $1";
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, COUNT(t.id)::int AS pagos, MAX(t.fecha_transaccion) AS ultimo
       FROM transacciones t
       JOIN inmuebles i ON i.id = t.inmueble_id
       JOIN usuarios u ON u.id = t.cliente_id
       ${where}
      GROUP BY u.id, u.nombre, u.email
      ORDER BY ultimo DESC NULLS LAST
      LIMIT 100`,
    corredorId == null ? [] : [corredorId]
  );
  return rows;
};

exports.citas = async (user) => {
  const { corredorId } = await alcance(user);
  const where = corredorId == null ? "" : "AND i.corredor_id = $1";
  const { rows } = await pool.query(
    `SELECT rv.id, rv.fecha_entrada, rv.fecha_salida, rv.num_huespedes,
            i.titulo AS inmueble, u.nombre AS cliente
       FROM reservas_vacacionales rv
       JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
       JOIN inmuebles i ON i.id = av.inmueble_id
       LEFT JOIN transacciones t ON t.id = rv.transaccion_id
       LEFT JOIN usuarios u ON u.id = rv.cliente_id
      WHERE rv.fecha_salida >= CURRENT_DATE
        AND (t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado')
        ${where}
      ORDER BY rv.fecha_entrada
      LIMIT 40`,
    corredorId == null ? [] : [corredorId]
  );
  return rows;
};
