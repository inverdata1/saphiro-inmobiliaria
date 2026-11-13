const bcrypt = require("bcrypt");
const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const { cupoDe } = require("./planes.cupo");

const PRECIO_PLAN = {
  pro: { mensual: 15, anual: 144 },
  pyme: { mensual: 35, anual: 336 },
  enterprise: { mensual: 75, anual: 720 },
};

function casaIdDe(row) {
  return row?.casa_id || row?.id;
}

async function filaCasa(client, corredorId) {
  const db = client || pool;
  const { rows } = await db.query(
    `SELECT h.*
     FROM corredores c
     JOIN corredores h ON h.id = COALESCE(c.casa_id, c.id)
     WHERE c.id = $1`,
    [Number(corredorId)]
  );
  if (!rows.length) throw new AppError("Corredor no existe", 404);
  return rows[0];
}

async function extrasVigentes(client, casaId) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n
     FROM cargos_portal
     WHERE corredor_id = $1 AND concepto = 'extra' AND estatus_pago = 'pagado' AND vigencia_hasta > NOW()`,
    [Number(casaId)]
  );
  return rows[0].n;
}

exports.assertCanonVacacional = async (client, corredorId) => {
  const casa = await filaCasa(client, corredorId);
  if (casa.opcion_vacacional !== "noche") return;
  const db = client || pool;
  const { rows } = await db.query(
    `SELECT
       (SELECT COUNT(*)::int FROM inmuebles
         WHERE deleted_at IS NULL AND estado_inmueble = 'vacacional'
           AND corredor_id IN (SELECT id FROM corredores WHERE id = $1 OR casa_id = $1)) AS n,
       (canon_vacacional_hasta IS NOT NULL
         AND canon_vacacional_hasta >= (NOW() AT TIME ZONE 'America/Caracas')::date) AS al_dia
     FROM corredores WHERE id = $1`,
    [casa.id]
  );
  const n = rows[0]?.n || 0;
  if (n >= 1 && !rows[0].al_dia) {
    throw new AppError(
      `El canon vacacional de este mes es $${(n * 1.5).toFixed(2)}. Págalo en Mi plan para publicar otra propiedad por noche.`,
      402
    );
  }
};

exports.assertPuedePublicar = async (client, corredorId, estado) => {
  const casa = await filaCasa(client, corredorId);
  const extra = (await extrasVigentes(client, casa.id)) + Number(casa.publicaciones_extra || 0);
  const cupo = cupoDe({ ...casa, publicaciones_extra: extra });
  if (String(estado || "") === "vacacional") {
    await exports.assertCanonVacacional(client, corredorId);
  }
  if (cupo.limite == null) return cupo;
  const { rows: countRows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM inmuebles
     WHERE deleted_at IS NULL AND corredor_id IN (SELECT id FROM corredores WHERE id = $1 OR casa_id = $1)`,
    [casa.id]
  );
  if (countRows[0].n >= cupo.limite) {
    throw new AppError(
      `El plan incluye ${cupo.limite} inmuebles activos. Para publicar otro hay que pagar la suscripción en Mi plan.`,
      402
    );
  }
  return cupo;
};

async function destacadosDelMes(casaId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM cargos_portal
     WHERE corredor_id = $1 AND concepto IN ('destacado', 'destacado_incluido')
       AND estatus_pago = 'pagado' AND creado_en >= date_trunc('month', NOW())`,
    [Number(casaId)]
  );
  return rows[0].n;
}

exports.destacar = async (inmuebleId) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, i.corredor_id, COALESCE(c.casa_id, c.id) AS casa_id
     FROM inmuebles i JOIN corredores c ON c.id = i.corredor_id
     WHERE i.id = $1 AND i.deleted_at IS NULL`,
    [Number(inmuebleId)]
  );
  if (!rows.length) throw new AppError("Inmueble no existe", 404);
  const casa = await filaCasa(pool, rows[0].casa_id);
  const cupo = cupoDe(casa);
  const usados = await destacadosDelMes(casa.id);
  if (usados < cupo.destacados) {
    const cargo = await crearYAplicar(casa.id, {
      concepto: "destacado_incluido",
      monto: 0,
      inmueble_id: rows[0].id,
      detalle: { incluido: true },
    });
    return { ...cargo, incluido: true, titulo: rows[0].titulo };
  }
  throw new AppError("El cupo de destacados de este mes se agotó. El corredor debe pagar $5 en Mi plan.", 402);
};

function montoDe(concepto, detalle, vacacionales) {
  if (concepto === "plan") {
    const tabla = PRECIO_PLAN[detalle.plan_codigo];
    if (!tabla) throw new AppError("Plan inválido", 400);
    const ciclo = detalle.ciclo === "anual" ? "anual" : "mensual";
    return tabla[ciclo];
  }
  if (concepto === "destacado") return 5;
  if (concepto === "repost") return 2;
  if (concepto === "extra") return 3;
  if (concepto === "banner") return 15;
  if (concepto === "fotos") {
    const n = Number(detalle.monto);
    if (n !== 30 && n !== 50) throw new AppError("El pack de fotos cuesta 30 o 50 USD", 400);
    return n;
  }
  if (concepto === "canon") return Math.round(Number(vacacionales) * 150) / 100;
  throw new AppError("Concepto de pago inválido", 400);
}

async function aplicar(client, cargo) {
  const det = cargo.detalle || {};
  if (cargo.concepto === "plan") {
    const meses = det.ciclo === "anual" ? 12 : 1;
    await client.query(
      `UPDATE corredores
       SET plan_codigo = $2, plan_pagado = true,
           plan_vigente_hasta = GREATEST(COALESCE(plan_vigente_hasta, NOW()), NOW()) + ($3 * INTERVAL '1 month')
       WHERE id = $1`,
      [cargo.corredor_id, det.plan_codigo, meses]
    );
  }
  if (cargo.concepto === "destacado" || cargo.concepto === "destacado_incluido") {
    await client.query(
      `UPDATE inmuebles SET destacado_hasta = NOW() + INTERVAL '7 days' WHERE id = $1`,
      [cargo.inmueble_id]
    );
  }
  if (cargo.concepto === "repost") {
    await client.query(`UPDATE inmuebles SET prioridad_at = NOW() WHERE id = $1`, [cargo.inmueble_id]);
  }
  if (cargo.concepto === "banner") {
    await client.query(
      `INSERT INTO anuncios (titulo, empresa, enlace, posicion, activo, corredor_id, vigente_hasta)
       VALUES ($1, $2, $3, 'lateral', true, $4, NOW() + INTERVAL '1 month')`,
      [det.titulo, det.empresa, det.enlace, cargo.corredor_id]
    );
  }
  if (cargo.concepto === "canon") {
    await client.query(
      `UPDATE corredores
       SET canon_vacacional_hasta = (GREATEST(COALESCE(canon_vacacional_hasta, CURRENT_DATE), CURRENT_DATE) + INTERVAL '1 month')::date
       WHERE id = $1`,
      [cargo.corredor_id]
    );
  }
}

async function crearYAplicar(corredorId, { concepto, monto, inmueble_id, detalle }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO cargos_portal (corredor_id, concepto, monto, moneda, estatus_pago, inmueble_id, detalle, vigencia_hasta)
       VALUES ($1, $2, $3, 'USD', 'pagado', $4, $5::jsonb, CASE WHEN $2 IN ('plan','extra','banner','canon') THEN NOW() + INTERVAL '1 month' ELSE NULL END)
       RETURNING *`,
      [corredorId, concepto, monto, inmueble_id || null, JSON.stringify(detalle || {})]
    );
    await aplicar(client, rows[0]);
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

exports.crearCargo = async (corredorId, body) => {
  const casa = await filaCasa(pool, corredorId);
  const concepto = String(body.concepto || "");
  const detalle = { ...(body.detalle || {}) };
  if (concepto === "plan") {
    detalle.plan_codigo = body.plan_codigo;
    detalle.ciclo = body.ciclo === "anual" ? "anual" : "mensual";
  }
  if (concepto === "fotos") detalle.monto = Number(body.monto);
  if (concepto === "banner") {
    detalle.titulo = String(body.titulo || "").trim();
    detalle.empresa = String(body.empresa || "").trim();
    detalle.enlace = String(body.enlace || "").trim();
    if (!detalle.titulo || !detalle.empresa || !detalle.enlace) throw new AppError("Título, empresa y enlace son obligatorios", 400);
  }
  if (["destacado", "repost", "fotos"].includes(concepto) && !body.inmueble_id) {
    throw new AppError("Indica el inmueble", 400);
  }
  const { rows: vac } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM inmuebles WHERE deleted_at IS NULL AND estado_inmueble = 'vacacional' AND corredor_id IN (SELECT id FROM corredores WHERE id = $1 OR casa_id = $1)`,
    [casa.id]
  );
  const monto = montoDe(concepto, detalle, vac[0].n);
  if (concepto === "canon" && monto <= 0) throw new AppError("No hay propiedades por noche para cobrar el canon", 400);
  if (concepto === "destacado") {
    const cupo = cupoDe(casa);
    const usados = await destacadosDelMes(casa.id);
    if (usados < cupo.destacados) {
      return crearYAplicar(casa.id, { concepto: "destacado_incluido", monto: 0, inmueble_id: body.inmueble_id, detalle: { incluido: true } });
    }
  }
  const meses = detalle.ciclo === "anual" ? 12 : 1;
  const { rows } = await pool.query(
    `INSERT INTO cargos_portal (corredor_id, concepto, monto, moneda, estatus_pago, inmueble_id, detalle, vigencia_hasta)
     VALUES ($1, $2, $3, 'USD', 'pendiente', $4, $5::jsonb, NOW() + ($6 * INTERVAL '1 month'))
     RETURNING *`,
    [casa.id, concepto, monto, body.inmueble_id || null, JSON.stringify(detalle), meses]
  );
  return rows[0];
};

exports.pagarCargo = async (cargoId, owner) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`SELECT * FROM cargos_portal WHERE id = $1 FOR UPDATE`, [Number(cargoId)]);
    if (!rows.length) throw new AppError("Cobro no existe", 404);
    if (owner) {
      const casa = await filaCasa(client, owner.id);
      if (Number(rows[0].corredor_id) !== Number(casa.id)) throw new AppError("Cobro no existe", 404);
    }
    if (rows[0].estatus_pago === "pagado") {
      await client.query("COMMIT");
      return rows[0];
    }
    const { rows: upd } = await client.query(
      `UPDATE cargos_portal SET estatus_pago = 'pagado' WHERE id = $1 RETURNING *`,
      [rows[0].id]
    );
    await aplicar(client, upd[0]);
    await client.query("COMMIT");
    return upd[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.corredorPorUsuario = async (usuarioId) => {
  const { rows } = await pool.query(`SELECT * FROM corredores WHERE usuario_id = $1`, [Number(usuarioId)]);
  if (!rows.length) throw new AppError("No eres corredor", 403);
  return rows[0];
};

exports.resumen = async (corredorId) => {
  const casa = await filaCasa(pool, corredorId);
  const extra = (await extrasVigentes(pool, casa.id)) + Number(casa.publicaciones_extra || 0);
  const cupo = cupoDe({ ...casa, publicaciones_extra: extra });
  const usados = await destacadosDelMes(casa.id);
  const { rows: asesores } = await pool.query(
    `SELECT c.id, u.nombre, u.email FROM corredores c JOIN usuarios u ON u.id = c.usuario_id WHERE c.casa_id = $1 ORDER BY u.nombre`,
    [casa.id]
  );
  const { rows: vehiculos } = await pool.query(
    `SELECT id, nombre, precio_dia, moneda, activo FROM vehiculos WHERE corredor_id = $1 ORDER BY id DESC`,
    [casa.id]
  );
  const { rows: vac } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM inmuebles WHERE deleted_at IS NULL AND estado_inmueble = 'vacacional' AND corredor_id IN (SELECT id FROM corredores WHERE id = $1 OR casa_id = $1)`,
    [casa.id]
  );
  const reporte = await exports.reporte(casa.id);
  let soporte = [];
  if (cupo.plan === "enterprise") {
    await asegurarSoporte();
    const { rows } = await pool.query(
      `SELECT id, mensaje, respuesta, creado_en FROM soporte_portal WHERE corredor_id = $1 ORDER BY id DESC LIMIT 20`,
      [casa.id]
    );
    soporte = rows;
  }
  return {
    casa,
    cupo,
    destacados_usados: usados,
    destacados_disponibles: Math.max(0, cupo.destacados - usados),
    asesores,
    vehiculos,
    vacacionales: vac[0].n,
    canon: vac[0].n * 1.5,
    reporte,
    soporte,
  };
};

exports.reporte = async (casaId) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, COALESCE(i.vistas, 0) AS vistas,
            (SELECT COUNT(*)::int FROM leads l WHERE l.inmueble_id = i.id) AS leads,
            (SELECT COUNT(*)::int FROM reservas_vacacionales rv JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id WHERE av.inmueble_id = i.id) AS reservas
     FROM inmuebles i
     WHERE i.deleted_at IS NULL AND i.corredor_id IN (SELECT id FROM corredores WHERE id = $1 OR casa_id = $1)
     ORDER BY i.vistas DESC, i.id DESC`,
    [Number(casaId)]
  );
  const tot = rows.reduce((a, r) => ({
    vistas: a.vistas + Number(r.vistas),
    leads: a.leads + Number(r.leads),
    reservas: a.reservas + Number(r.reservas),
  }), { vistas: 0, leads: 0, reservas: 0 });
  return { inmuebles: rows, totales: tot };
};

exports.crearAsesor = async (corredorId, body) => {
  const casa = await filaCasa(pool, corredorId);
  if (casa.casa_id) throw new AppError("Solo la cuenta principal crea asesores", 403);
  const cupo = cupoDe(casa);
  if (cupo.asesores === 0) throw new AppError("Las subcuentas de asesores entran en Pyme o Enterprise", 402);
  const { rows: n } = await pool.query(`SELECT COUNT(*)::int AS n FROM corredores WHERE casa_id = $1`, [casa.id]);
  if (cupo.asesores != null && n[0].n >= cupo.asesores) {
    throw new AppError(`Este plan incluye ${cupo.asesores} asesores`, 402);
  }
  const nombre = String(body.nombre || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!nombre || !email || password.length < 8) throw new AppError("Nombre, correo y una clave de 8 caracteres", 400);
  const password_hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: users } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, fecha_registro, email_verified)
       VALUES ($1, $2, $3, 'corredor', NOW(), true)
       RETURNING id, nombre, email`,
      [nombre, email, password_hash]
    );
    const { rows: cor } = await client.query(
      `INSERT INTO corredores (usuario_id, comision_base, casa_id) VALUES ($1, $2, $3) RETURNING id`,
      [users[0].id, casa.comision_base || 0, casa.id]
    );
    await client.query("COMMIT");
    return { ...users[0], corredor_id: cor[0].id };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") throw new AppError("Ese correo ya está registrado", 409);
    throw err;
  } finally {
    client.release();
  }
};

exports.crearVehiculo = async (corredorId, body) => {
  const casa = await filaCasa(pool, corredorId);
  const nombre = String(body.nombre || "").trim();
  const precio = Number(body.precio_dia);
  if (!nombre || !Number.isFinite(precio) || precio < 0) throw new AppError("Nombre y precio por día", 400);
  const { rows } = await pool.query(
    `INSERT INTO vehiculos (corredor_id, nombre, precio_dia) VALUES ($1, $2, $3) RETURNING *`,
    [casa.id, nombre, precio]
  );
  return rows[0];
};

exports.listarVehiculos = async (inmuebleId) => {
  const { rows } = await pool.query(
    `SELECT v.id, v.nombre, v.precio_dia, v.moneda
     FROM vehiculos v
     JOIN inmuebles i ON COALESCE((SELECT casa_id FROM corredores WHERE id = i.corredor_id), i.corredor_id) = v.corredor_id
     WHERE i.id = $1 AND v.activo = true
     ORDER BY v.nombre`,
    [Number(inmuebleId)]
  );
  return rows;
};

exports.precioVehiculo = async (vehiculoId, corredorId, noches) => {
  const { rows } = await pool.query(
    `SELECT v.* FROM vehiculos v
     JOIN corredores c ON c.id = $2
     WHERE v.id = $1 AND v.activo = true AND v.corredor_id = COALESCE(c.casa_id, c.id)`,
    [Number(vehiculoId), Number(corredorId)]
  );
  if (!rows.length) throw new AppError("Vehículo no disponible", 404);
  const dias = Math.max(1, Number(noches) || 1);
  return { vehiculo: rows[0], precio: dias * Number(rows[0].precio_dia), dias };
};

exports.registrarLead = async (client, inmuebleId, tipo) => {
  const db = client || pool;
  await db.query(
    `INSERT INTO leads (inmueble_id, corredor_id, tipo)
     SELECT i.id, COALESCE(c.casa_id, i.corredor_id), $2 FROM inmuebles i JOIN corredores c ON c.id = i.corredor_id WHERE i.id = $1`,
    [Number(inmuebleId), tipo]
  );
};

exports.verVista = async (inmuebleId) => {
  await pool.query(`UPDATE inmuebles SET vistas = COALESCE(vistas, 0) + 1 WHERE id = $1`, [Number(inmuebleId)]);
};

exports.aplicarCobroDeInmueble = async (inmuebleId, concepto) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, COALESCE(c.casa_id, c.id) AS casa_id
     FROM inmuebles i
     JOIN corredores c ON c.id = i.corredor_id
     WHERE i.id = $1 AND i.deleted_at IS NULL`,
    [Number(inmuebleId)]
  );
  if (!rows.length) throw new AppError("Inmueble no existe", 404);
  const cargo = await exports.crearCargo(rows[0].casa_id, { concepto, inmueble_id: rows[0].id });
  const pagado = cargo.estatus_pago === "pagado" ? cargo : await exports.pagarCargo(cargo.id);
  return { ...pagado, titulo: rows[0].titulo };
};

async function asegurarSoporte() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS soporte_portal (
       id serial PRIMARY KEY,
       corredor_id integer NOT NULL,
       mensaje text NOT NULL,
       respuesta text,
       creado_en timestamptz NOT NULL DEFAULT NOW()
     )`
  );
}

exports.oficina = async () => {
  await asegurarSoporte();
  const cargos = await pool.query(
    `SELECT cp.id, cp.concepto, cp.monto, cp.estatus_pago, cp.inmueble_id, cp.detalle, cp.vigencia_hasta, cp.creado_en,
            u.nombre AS corredor, i.titulo AS inmueble
     FROM cargos_portal cp
     JOIN corredores c ON c.id = cp.corredor_id
     JOIN usuarios u ON u.id = c.usuario_id
     LEFT JOIN inmuebles i ON i.id = cp.inmueble_id
     ORDER BY cp.id DESC
     LIMIT 40`
  );
  const asesores = await pool.query(
    `SELECT c.id, c.casa_id, u.nombre, u.email, casa_u.nombre AS casa
     FROM corredores c
     JOIN usuarios u ON u.id = c.usuario_id
     LEFT JOIN corredores h ON h.id = c.casa_id
     LEFT JOIN usuarios casa_u ON casa_u.id = h.usuario_id
     WHERE c.casa_id IS NOT NULL
     ORDER BY u.nombre`
  );
  const vehiculos = await pool.query(
    `SELECT v.id, v.nombre, v.precio_dia, v.activo, u.nombre AS corredor
     FROM vehiculos v
     JOIN corredores c ON c.id = v.corredor_id
     JOIN usuarios u ON u.id = c.usuario_id
     ORDER BY v.id DESC`
  );
  const soporte = await pool.query(
    `SELECT s.id, s.mensaje, s.respuesta, s.creado_en, u.nombre AS corredor
     FROM soporte_portal s
     JOIN corredores c ON c.id = s.corredor_id
     JOIN usuarios u ON u.id = c.usuario_id
     ORDER BY s.id DESC
     LIMIT 30`
  );
  const rendimiento = await exports.reporteOficina();
  return {
    cargos: cargos.rows,
    asesores: asesores.rows,
    vehiculos: vehiculos.rows,
    soporte: soporte.rows,
    reporte: rendimiento,
  };
};

exports.reporteOficina = async () => {
  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, COALESCE(i.vistas, 0) AS vistas, u.nombre AS corredor,
            (SELECT COUNT(*)::int FROM leads l WHERE l.inmueble_id = i.id) AS leads,
            (SELECT COUNT(*)::int FROM reservas_vacacionales rv
               JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
              WHERE av.inmueble_id = i.id) AS reservas
     FROM inmuebles i
     JOIN corredores c ON c.id = i.corredor_id
     JOIN usuarios u ON u.id = c.usuario_id
     WHERE i.deleted_at IS NULL
     ORDER BY i.vistas DESC, i.id DESC
     LIMIT 80`
  );
  const totales = rows.reduce((a, r) => ({
    vistas: a.vistas + Number(r.vistas),
    leads: a.leads + Number(r.leads),
    reservas: a.reservas + Number(r.reservas),
  }), { vistas: 0, leads: 0, reservas: 0 });
  return { inmuebles: rows, totales };
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

exports.clasificarPack = (monto, files) => {
  const list = files || [];
  if (!list.length) throw new AppError("Sube las fotos del inmueble.", 400);
  const videos = list.filter((f) => VIDEO_EXT.test(f.originalname || f.filename || ""));
  const fotos = list.length - videos.length;
  if (Number(monto) >= 50) {
    if (!videos.length) throw new AppError("El pack de $50 incluye un video del inmueble.", 400);
  } else if (videos.length) {
    throw new AppError("El pack de $30 es solo fotos. El video entra en el de $50.", 400);
  }
  if (!fotos) throw new AppError("Sube al menos una foto.", 400);
  return { fotos, videos: videos.length };
};

exports.entregarCargo = async (cargoId, files) => {
  const { rows } = await pool.query(
    `SELECT id, monto, estatus_pago, inmueble_id, detalle
     FROM cargos_portal WHERE id = $1 AND concepto = 'fotos'`,
    [Number(cargoId)]
  );
  if (!rows.length) throw new AppError("Pedido de fotos no existe", 404);
  const cargo = rows[0];
  if (cargo.estatus_pago !== "pagado") throw new AppError("El pack todavía no está pagado.", 400);
  if (!cargo.inmueble_id) throw new AppError("El pedido no tiene inmueble.", 400);
  if (cargo.detalle?.entregado) throw new AppError("Ese pack ya está en la ficha.", 409);
  const cuenta = exports.clasificarPack(cargo.monto, files);
  const imagenes = require("./imagenes.service");
  const creadas = await imagenes.createImages(cargo.inmueble_id, files);
  const detalle = {
    ...(cargo.detalle || {}),
    entregado: true,
    fotos: cuenta.fotos,
    videos: cuenta.videos,
  };
  const { rows: upd } = await pool.query(
    `UPDATE cargos_portal SET detalle = $2::jsonb WHERE id = $1
     RETURNING id, concepto, detalle, inmueble_id`,
    [cargo.id, JSON.stringify(detalle)]
  );
  return { ...upd[0], imagenes: creadas };
};

exports.crearSoporte = async (corredorId, body) => {
  await asegurarSoporte();
  const casa = await filaCasa(pool, corredorId);
  const cupo = cupoDe(casa);
  if (cupo.plan !== "enterprise") throw new AppError("El soporte prioritario entra con Enterprise", 402);
  const mensaje = String(body.mensaje || "").trim();
  if (mensaje.length < 4) throw new AppError("Escribe el mensaje", 400);
  const { rows } = await pool.query(
    `INSERT INTO soporte_portal (corredor_id, mensaje) VALUES ($1, $2) RETURNING id, mensaje, creado_en`,
    [casa.id, mensaje]
  );
  return rows[0];
};

exports.responderSoporte = async (id, body) => {
  await asegurarSoporte();
  const respuesta = String(body.respuesta || "").trim();
  if (!respuesta) throw new AppError("Escribe la respuesta", 400);
  const { rows } = await pool.query(
    `UPDATE soporte_portal SET respuesta = $2 WHERE id = $1 RETURNING id, mensaje, respuesta`,
    [Number(id), respuesta]
  );
  if (!rows.length) throw new AppError("Mensaje no existe", 404);
  return rows[0];
};
