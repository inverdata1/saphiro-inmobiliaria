const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");

function clampInt(n, { min, max, def }) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return Math.min(max, Math.max(min, Math.trunc(x)));
}

exports.listInmuebles = async (filters) => {
  const {
    estatus,
    estado_inmueble,
    min,
    max,
    ciudad_id,
    estado_id,
    tipo_inmueble_id,
    corredor_id,
    q,
    limit,
    offset,
  } = filters;

  const whereClauses = [];
  const values = [];

  if (estatus) {
    values.push(estatus);
    whereClauses.push(`i.estatus = $${values.length}`);
  }

  if (estado_inmueble) {
    values.push(estado_inmueble);
    whereClauses.push(`i.estado_inmueble = $${values.length}`);
  }

  if (min !== undefined && min !== "") {
    values.push(Number(min));
    whereClauses.push(`i.precio >= $${values.length}`);
  }

  if (max !== undefined && max !== "") {
    values.push(Number(max));
    whereClauses.push(`i.precio <= $${values.length}`);
  }

  if (ciudad_id) {
    values.push(Number(ciudad_id));
    whereClauses.push(`c.id = $${values.length}`);
  }

  if (estado_id) {
    values.push(Number(estado_id));
    whereClauses.push(`e.id = $${values.length}`);
  }
  
  if (tipo_inmueble_id) {
    values.push(Number(tipo_inmueble_id));
    whereClauses.push(`i.tipo_inmueble_id = $${values.length}`);
  }

  if (corredor_id) {
    values.push(Number(corredor_id));
    whereClauses.push(`i.corredor_id = $${values.length}`);
  }
  
  if (q) {
    values.push(`%${q}%`);
    whereClauses.push(`(i.titulo ILIKE $${values.length} OR i.descripcion ILIKE $${values.length})`);
  }

  whereClauses.push(`(i.estatus <> 'vendido')`);
  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const lim = clampInt(limit, { min: 1, max: 500, def: 100 });
  const off = clampInt(offset, { min: 0, max: 1000000, def: 0 });

  values.push(lim);
  const limPos = values.length;

  values.push(off);
  const offPos = values.length;

  const sql = `
    SELECT
      i.*,
      INITCAP(REPLACE(i.estado_inmueble, '_', ' ')) AS estado_inmueble,
      ti.nombre AS tipo_inmueble,
      c.nombre  AS ciudad,
      e.nombre  AS estado,
      u.nombre  AS corredor_nombre,
      (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS imagen_url,
      (
        SELECT json_agg(json_build_object('nombre', c.nombre, 'valor', ci.valor, 'unidad_medicion', c.unidad_medicion))
        FROM (
          SELECT ci2.caracteristica_id, ci2.valor
          FROM caracteristica_inmueble ci2
          WHERE ci2.inmueble_id = i.id
          ORDER BY ci2.caracteristica_id ASC
          LIMIT 4
        ) ci
        JOIN caracteristicas c ON c.id = ci.caracteristica_id
      ) AS caracteristicas
    FROM inmuebles i
    LEFT JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
    LEFT JOIN ciudades c ON c.id = i.ciudad_id
    LEFT JOIN estados e ON e.id = c.estado_id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    LEFT JOIN usuarios u ON u.id = co.usuario_id
    ${where}
    ORDER BY i.id DESC
    LIMIT $${limPos} OFFSET $${offPos};
  `;

  const { rows } = await pool.query(sql, values);
  return rows;
};

exports.getInmuebleById = async (id) => {
  if (!id) throw new AppError("id inválido", 400);

  const sql = `
    SELECT
      i.*,
      ti.nombre AS tipo_inmueble,
      c.nombre  AS ciudad,
      e.nombre  AS estado,
      u.nombre  AS corredor_nombre,
      ug.latitud,
      ug.longitud,
      ug.google_maps_url
    FROM inmuebles i
    LEFT JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
    LEFT JOIN ciudades c ON c.id = i.ciudad_id
    LEFT JOIN estados e ON e.id = c.estado_id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    LEFT JOIN usuarios u ON u.id = co.usuario_id
    LEFT JOIN LATERAL (
      SELECT latitud, longitud, google_maps_url
      FROM ubicaciones_gps
      WHERE inmueble_id = i.id
      ORDER BY id DESC
      LIMIT 1
    ) ug ON true
    WHERE i.id = $1;
  `;

  const { rows } = await pool.query(sql, [id]);
  if (!rows.length) throw new AppError("Inmueble no existe", 404);

  const result = rows[0];

  const { rows: imagenes } = await pool.query(
    "SELECT id, url, orden, portada FROM imagenes WHERE inmueble_id = $1 ORDER BY orden ASC",
    [id]
  );
  result.imagen_url = imagenes.length ? imagenes[0].url : null;
  result.imagenes = imagenes;

  return result;
};

exports.createInmueble = async (data, files = [], ctx) => {
  const {
    titulo,
    descripcion,
    tipo_inmueble_id,
    estado_inmueble,
    precio,
    moneda,
    ciudad_id,
    direccion_exacta,
    area_m2,
    corredor_id,
    latitud,
    longitud,
    caracteristicas,
    punto_referencia
  } = data;

  if (!titulo) throw new AppError("titulo es requerido", 400);
  if (!estado_inmueble) throw new AppError("estado_inmueble es requerido", 400);
  if (precio === undefined || precio === null || precio === "") throw new AppError("precio es requerido", 400);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO inmuebles (
        titulo, descripcion, tipo_inmueble_id, estado_inmueble, precio, moneda,
        ciudad_id, direccion_exacta, area_m2, corredor_id, punto_referencia
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *;`,
      [
        titulo,
        descripcion || null,
        tipo_inmueble_id ? Number(tipo_inmueble_id) : null,
        estado_inmueble,
        Number(precio),
        moneda || "USD",
        ciudad_id ? Number(ciudad_id) : null,
        direccion_exacta || null,
        area_m2 ?? null,
        corredor_id ? Number(corredor_id) : null,
        punto_referencia || null
      ]
    );
    const inmueble = rows[0];

    if (latitud && longitud) {
      const google_maps_url = `https://maps.google.com/?q=${latitud},${longitud}`;
      await client.query(
        `INSERT INTO ubicaciones_gps (inmueble_id, latitud, longitud, google_maps_url) VALUES ($1, $2, $3, $4);`,
        [inmueble.id, Number(latitud), Number(longitud), google_maps_url]
      );
    }

    if (caracteristicas && Array.isArray(caracteristicas)) {
      for (const c of caracteristicas) {
        if (c.caracteristica_id) {
          await client.query(
            `INSERT INTO caracteristica_inmueble (caracteristica_id, inmueble_id, valor) VALUES ($1, $2, $3);`,
            [Number(c.caracteristica_id), inmueble.id, c.valor]
          );
        }
      }
    }

    if (files.length) {
      const existing = await client.query(
        "SELECT COALESCE(MAX(orden), 0) AS max_orden FROM imagenes WHERE inmueble_id = $1",
        [inmueble.id]
      );
      let nextOrden = existing.rows[0].max_orden + 1;

      for (let i = 0; i < files.length; i++) {
        const orden = nextOrden + i;
        const portada = i === 0 && nextOrden === 1;

        const { rows: imgRows } = await client.query(
          `INSERT INTO imagenes (inmueble_id, url, orden, portada, ruta_s3) VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
          [inmueble.id, "/uploads/" + files[i].filename, orden, portada, "/uploads/" + files[i].filename]
        );

        const imgId = imgRows[0].id;
        const url = `/imagenes/file/${imgId}`;

        await client.query(
          `UPDATE imagenes SET url = $1 WHERE id = $2;`,
          [url, imgId]
        );
      }
    }

    await client.query("COMMIT");

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "inmuebles",
        descripcion: `Creación de inmueble ${inmueble.id} ("${inmueble.titulo}")`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      });
    }

    return inmueble;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.patchInmueble = async (id, body, ctx) => {
  if (!id) throw new AppError("id inválido", 400);

  const allowed = new Set([
    "titulo",
    "descripcion",
    "tipo_inmueble_id",
    "estado_inmueble",
    "precio",
    "ciudad_id",
    "direccion_exacta",
    "area_m2",
    "estatus",
    "corredor_id",
  ]);

  const keys = Object.keys(body || {}).filter((k) => allowed.has(k));
  if (!keys.length) throw new AppError("No hay campos válidos para actualizar", 400);

  const set = [];
  const values = [];

  keys.forEach((k) => {
    let v = body[k];
    if (["precio", "area_m2"].includes(k)) v = v === "" ? null : Number(v);
    if (["tipo_inmueble_id", "ciudad_id", "corredor_id"].includes(k))
      v = v === "" ? null : Number(v);
    values.push(v);
    set.push(`${k} = $${values.length}`);
  });

  values.push(id);

  const sql = `
    UPDATE inmuebles
    SET ${set.join(", ")}
    WHERE id = $${values.length}
    RETURNING *;
  `;

  const { rows } = await pool.query(sql, values);
  if (!rows.length) throw new AppError("Inmueble no existe", 404);

  if (ctx) {
    await auditoriaService.registrarUpdate({
      usuario_id: ctx.usuario_id,
      tabla_afectada: "inmuebles",
      descripcion: `Actualizado inmueble ${id}: ${keys.join(", ")}`,
      ip_address: ctx.ip_address,
      user_agent: ctx.user_agent,
    });
  }

  return rows[0];
};

exports.listDisponiblesPorCiudad = async (ciudadId, q) => {
  if (!ciudadId) throw new AppError("ciudad_id requerido", 400);

  const values = [ciudadId];
  let where = `WHERE i.ciudad_id = $1 AND i.estatus = 'disponible'`;

  if (q) {
    values.push(`%${q}%`);
    where += ` AND (i.titulo ILIKE $${values.length} OR CAST(i.id AS TEXT) LIKE $${values.length})`;
  }

  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, i.precio, i.moneda, i.estado_inmueble, i.estatus, i.corredor_id,
            i.descripcion, i.tipo_inmueble_id, i.area_m2, i.direccion_exacta,
            c.nombre AS ciudad,
            (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS imagen_url
     FROM inmuebles i
     LEFT JOIN ciudades c ON c.id = i.ciudad_id
     ${where}
     ORDER BY i.id DESC
     LIMIT 200;`,
    values
  );

  return rows;
};

exports.listDisponiblesPorEstado = async (estadoId) => {
  if (!estadoId) throw new AppError("estado_id requerido", 400);

  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, i.precio, i.moneda, i.estado_inmueble, i.estatus, i.corredor_id
     FROM inmuebles i
     LEFT JOIN ciudades c ON c.id = i.ciudad_id
     WHERE c.estado_id = $1 AND i.estatus = 'disponible'
     ORDER BY i.id DESC
     LIMIT 200;`,
    [estadoId]
  );

  return rows;
};
