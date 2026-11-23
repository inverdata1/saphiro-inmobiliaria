const cron = require("node-cron");
const pool = require("../db/pool");
const notificacionesService = require("../services/notificaciones.service");

async function avisarSalidas() {
  const { rows } = await pool.query(
    `SELECT rv.id, rv.fecha_salida, i.titulo
       FROM reservas_vacacionales rv
       JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
       JOIN inmuebles i ON i.id = av.inmueble_id
       LEFT JOIN transacciones t ON t.id = rv.transaccion_id
      WHERE rv.fecha_salida = (CURRENT_DATE + 1)
        AND COALESCE(t.estatus_pago, '') <> 'cancelado'`
  );

  for (const row of rows) {
    const marca = `[salida-reserva-${row.id}]`;
    const exists = await pool.query(
      `SELECT 1 FROM notificaciones WHERE descripcion LIKE $1 LIMIT 1`,
      [`%${marca}%`]
    );
    if (exists.rowCount) continue;
    await notificacionesService.createToAllAdmins({
      titulo: "Salida mañana",
      descripcion: `El inmueble ${row.titulo} tiene salida mañana (${row.fecha_salida}). ${marca}`,
      tipo_notificacion: "Transaccion",
    });
  }

  const entradas = await pool.query(
    `SELECT rv.id, rv.fecha_entrada, rv.fecha_salida, rv.cliente_id, i.titulo, co.usuario_id AS corredor_usuario_id
       FROM reservas_vacacionales rv
       JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
       JOIN inmuebles i ON i.id = av.inmueble_id
       LEFT JOIN corredores co ON co.id = i.corredor_id
       LEFT JOIN transacciones t ON t.id = rv.transaccion_id
      WHERE rv.fecha_entrada = (CURRENT_DATE + 1)
        AND COALESCE(t.estatus_pago, '') <> 'cancelado'`
  );
  for (const row of entradas.rows) {
    const marca = `[entrada-reserva-${row.id}]`;
    const exists = await pool.query(
      `SELECT 1 FROM notificaciones WHERE descripcion LIKE $1 LIMIT 1`,
      [`%${marca}%`]
    );
    if (exists.rowCount) continue;
    const texto = `Mañana empieza la reserva de ${row.titulo}, del ${row.fecha_entrada} al ${row.fecha_salida}. ${marca}`;
    const destinos = [row.corredor_usuario_id, row.cliente_id].filter(Boolean);
    for (const usuario_id of destinos) {
      await notificacionesService.create({
        usuario_id,
        titulo: "La reserva es mañana",
        descripcion: texto,
        tipo_notificacion: "Transaccion",
      });
    }
  }
}


async function expirarReservasSinPago() {
  const { rows } = await pool.query(
    `UPDATE transacciones t
        SET estatus_pago = 'cancelado'
       FROM reservas_vacacionales rv
       JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
       JOIN inmuebles i ON i.id = av.inmueble_id
       LEFT JOIN corredores co ON co.id = i.corredor_id
      WHERE t.id = rv.transaccion_id
        AND t.estatus_pago = 'pendiente'
        AND COALESCE(rv.autorizada, false) = false
        AND rv.apartado_hasta IS NOT NULL
        AND rv.apartado_hasta < NOW()
      RETURNING rv.id, rv.cliente_id, rv.fecha_entrada, rv.fecha_salida,
                i.titulo, i.numero_apto, co.usuario_id AS corredor_usuario_id`
  );
  for (const row of rows) {
    const apto = row.numero_apto ? `${String(row.numero_apto).trim()}. ` : "";
    const texto = `${apto}La reserva de ${row.titulo}, del ${row.fecha_entrada} al ${row.fecha_salida}, se canceló porque pasaron 24 horas sin pago. Los días quedaron libres.`;
    const destinos = [row.corredor_usuario_id, row.cliente_id].filter(Boolean);
    for (const usuario_id of destinos) {
      await notificacionesService.create({
        usuario_id,
        titulo: "Reserva vencida sin pago",
        descripcion: texto,
        tipo_notificacion: "Transaccion",
      });
    }
  }
  if (rows.length) {
    await pool.query(
      `UPDATE reservas_vacacionales
          SET motivo_cancelacion = COALESCE(motivo_cancelacion, 'Venció el apartado de 24 horas')
        WHERE id = ANY($1::int[])`,
      [rows.map((r) => r.id)]
    );
    console.log(`[Reservas 24h] canceladas ${rows.length}`);
  }
}

function initSalidasJob() {
  cron.schedule("0 8 * * *", () => {
    avisarSalidas().catch((err) => console.error("[Salidas Job]", err.message));
  }, { timezone: "America/Caracas" });
  cron.schedule("*/15 * * * *", () => {
    expirarReservasSinPago().catch((err) => console.error("[Reservas 24h]", err.message));
  }, { timezone: "America/Caracas" });

  setTimeout(() => {
    avisarSalidas().catch((err) => console.error("[Salidas Job]", err.message));
    expirarReservasSinPago().catch((err) => console.error("[Reservas 24h]", err.message));
  }, 8000);
}

module.exports = { initSalidasJob, avisarSalidas };
