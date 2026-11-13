const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const { cupoDe } = require("./planes.cupo");

const PLANES = [
  {
    codigo: "basico",
    nombre: "Básico",
    activos: 3,
    precio_mensual: 0,
    precio_anual: 0,
    incluye: "Perfil público de agente y leads directo a WhatsApp.",
  },
  {
    codigo: "pro",
    nombre: "Corredor Pro",
    activos: 15,
    precio_mensual: 15,
    precio_anual: 144,
    incluye: "1 destacado al mes, estadísticas de vistas y leads, gestión vacacional.",
  },
  {
    codigo: "pyme",
    nombre: "Inmobiliaria Pyme",
    activos: 50,
    precio_mensual: 35,
    precio_anual: 336,
    incluye: "3 destacados al mes, hasta 3 asesores y badge de inmobiliaria verificada.",
  },
  {
    codigo: "enterprise",
    nombre: "Enterprise",
    activos: null,
    precio_mensual: 75,
    precio_anual: 720,
    incluye: "10 destacados al mes, subcuentas ilimitadas, soporte prioritario y reportes.",
  },
];

const BOOSTS = [
  { codigo: "destacado", nombre: "Destacado en portada", precio: 5, detalle: "7 días en el carrusel principal." },
  { codigo: "repost", nombre: "Re-post", precio: 2, detalle: "Sube la publicación al inicio de su categoría." },
  { codigo: "extra", nombre: "Publicación extra", precio: 3, detalle: "USD al mes por cada inmueble por encima del plan." },
];

const VACACIONAL = {
  porcentaje: "3 % a 5 % del alquiler si el portal procesa el pago.",
  noche: "1.50 USD al mes por cada propiedad de alquiler por noche.",
};

const ADDONS = [
  { codigo: "fotos", nombre: "Pack de fotografía y video", precio: "30 a 50 USD por inmueble" },
  { codigo: "banner", nombre: "Banner lateral", precio: "15 USD al mes" },
];

exports.PLANES = PLANES;
exports.cupoDe = cupoDe;

exports.catalogo = () => ({
  tope_gratis: 3,
  planes: PLANES,
  boosts: BOOSTS,
  vacacional: VACACIONAL,
  addons: ADDONS,
});

exports.portada = async () => {
  const anuncios = await pool.query(
    `SELECT id, titulo, empresa, enlace, posicion
     FROM anuncios
     WHERE activo = true AND (vigente_hasta IS NULL OR vigente_hasta > NOW())
     ORDER BY id DESC`
  );
  const destacados = await pool.query(
    `SELECT i.id, i.titulo, i.precio, i.moneda, i.estado_inmueble, i.estatus,
            c.nombre AS ciudad,
            (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS imagen_url
     FROM inmuebles i
     LEFT JOIN ciudades c ON c.id = i.ciudad_id
     WHERE i.deleted_at IS NULL
       AND i.destacado_hasta > NOW()
       AND i.estatus <> 'vendido'
     ORDER BY i.destacado_hasta DESC
     LIMIT 12`
  );
  return { anuncios: anuncios.rows, destacados: destacados.rows };
};

exports.listarCorredores = async () => {
  const { rows } = await pool.query(
    `SELECT co.id, co.plan_codigo, co.plan_pagado, co.publicaciones_extra,
            co.opcion_vacacional, co.porcentaje_vacacional, co.plan_vigente_hasta,
            (SELECT COUNT(*)::int FROM cargos_portal cp
              WHERE cp.corredor_id = COALESCE(co.casa_id, co.id)
                AND cp.concepto = 'extra' AND cp.estatus_pago = 'pagado' AND cp.vigencia_hasta > NOW()) AS extras_pagados,
            u.nombre, u.email,
            (SELECT COUNT(*)::int FROM inmuebles i WHERE i.corredor_id = co.id AND i.deleted_at IS NULL) AS activos,
            (SELECT COUNT(*)::int FROM inmuebles i WHERE i.corredor_id = co.id AND i.deleted_at IS NULL AND i.estado_inmueble = 'vacacional') AS vacacionales
     FROM corredores co
     JOIN usuarios u ON u.id = co.usuario_id
     ORDER BY u.nombre ASC`
  );
  return rows.map((row) => ({
    ...row,
    cupo: cupoDe({ ...row, publicaciones_extra: Number(row.publicaciones_extra || 0) + Number(row.extras_pagados || 0) }),
  }));
};

exports.asignarPlan = async (corredorId, body) => {
  const codigo = String(body.plan_codigo || "basico");
  if (!PLANES.some((p) => p.codigo === codigo)) throw new AppError("Plan inválido", 400);
  const pagado = codigo === "basico" ? false : Boolean(body.plan_pagado);
  const extra = Math.max(0, Number(body.publicaciones_extra || 0));
  const opcion = body.opcion_vacacional === "noche" ? "noche" : "porcentaje";
  let porcentaje = Number(body.porcentaje_vacacional ?? 3);
  if (!Number.isFinite(porcentaje)) porcentaje = 3;
  porcentaje = Math.min(5, Math.max(3, porcentaje));
  const renovar = body.ciclo === "anual" || body.ciclo === "mensual";
  const meses = body.ciclo === "anual" ? 12 : 1;
  const { rows } = await pool.query(
    `UPDATE corredores
     SET plan_codigo = $2,
         plan_pagado = $3,
         publicaciones_extra = $4,
         opcion_vacacional = $5,
         porcentaje_vacacional = $6,
         plan_vigente_hasta = CASE
           WHEN $3 = false THEN NULL
           WHEN $8 THEN NOW() + ($7 * INTERVAL '1 month')
           ELSE plan_vigente_hasta
         END
     WHERE id = $1
     RETURNING id, plan_codigo, plan_pagado, publicaciones_extra, opcion_vacacional, porcentaje_vacacional, plan_vigente_hasta`,
    [Number(corredorId), codigo, pagado, extra, opcion, porcentaje, meses, renovar]
  );
  if (!rows.length) throw new AppError("Corredor no existe", 404);
  return rows[0];
};

exports.destacar = async (inmuebleId) => {
  const { rows } = await pool.query(
    `UPDATE inmuebles
     SET destacado_hasta = NOW() + INTERVAL '7 days'
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, titulo, destacado_hasta`,
    [Number(inmuebleId)]
  );
  if (!rows.length) throw new AppError("Inmueble no existe", 404);
  return rows[0];
};

exports.repost = async (inmuebleId) => {
  const { rows } = await pool.query(
    `UPDATE inmuebles
     SET prioridad_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, titulo, prioridad_at`,
    [Number(inmuebleId)]
  );
  if (!rows.length) throw new AppError("Inmueble no existe", 404);
  return rows[0];
};

exports.crearAnuncio = async (body) => {
  const titulo = String(body.titulo || "").trim();
  const empresa = String(body.empresa || "").trim();
  const enlace = String(body.enlace || "").trim();
  if (!titulo || !empresa || !enlace) throw new AppError("Título, empresa y enlace son obligatorios", 400);
  const posicion = body.posicion === "lateral" ? "lateral" : "carrusel";
  const corredorId = Number(body.corredor_id) || null;
  const { rows } = await pool.query(
    `INSERT INTO anuncios (titulo, empresa, enlace, posicion, activo, corredor_id, vigente_hasta)
     VALUES ($1, $2, $3, $4, true, $5, NOW() + INTERVAL '1 month')
     RETURNING *`,
    [titulo, empresa, enlace, posicion, corredorId]
  );
  return rows[0];
};

exports.borrarAnuncio = async (id) => {
  const { rows } = await pool.query(`DELETE FROM anuncios WHERE id = $1 RETURNING id`, [Number(id)]);
  if (!rows.length) throw new AppError("Anuncio no existe", 404);
  return rows[0];
};

exports.assertPuedePublicar = async (client, corredorId, estado) => {
  const cobertura = require("./cobertura.service");
  return cobertura.assertPuedePublicar(client, corredorId, estado);
};

exports.assertCanonVacacional = async (client, corredorId) => {
  const cobertura = require("./cobertura.service");
  return cobertura.assertCanonVacacional(client, corredorId);
};
