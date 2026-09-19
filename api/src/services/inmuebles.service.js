const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");

function clampInt(n, { min, max, def }) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return Math.min(max, Math.max(min, Math.trunc(x)));
}

const VACACIONAL_SELECT = `,
  CASE WHEN i.estado_inmueble = 'vacacional' THEN (
    SELECT json_build_object(
      'id', av.id,
      'precio_por_noche', av.precio_por_noche,
      'capacidad_personas', av.capacidad_personas,
      'noches_minimas', av.noches_minimas,
      'hora_checkin', av.hora_checkin,
      'hora_checkout', av.hora_checkout,
      'costos_adicionales', (
        SELECT COALESCE(json_agg(json_build_object(
          'costo_adicional_id', c2.id,
          'costo_adicional_nombre', c2.nombre,
          'monto', avc.monto
        )), '[]'::json)
        FROM alquiler_vacacional_costos_adicionales avc
        JOIN costos_adicionales c2 ON c2.id = avc.costo_adicional_id
        WHERE avc.alquiler_vacacional_id = av.id
      )
    )
    FROM alquiler_vacacional av
    WHERE av.inmueble_id = i.id
    LIMIT 1
  ) ELSE NULL END AS alquiler_vacacional
`;

// Cálculo dinámico del estatus del inmueble.
// Vacacionales con reserva vencida (fecha_salida < hoy) vuelven a "disponible" automáticamente.
const ESTATUS_SELECT = `,
  COALESCE((
    SELECT CASE
      WHEN t.tipo_operacion = 'venta' AND t.estatus_pago = 'pagado' THEN 'vendido'
      WHEN t.tipo_operacion = 'alquiler' AND t.estatus_pago = 'pagado' AND i.estado_inmueble <> 'vacacional' THEN 'alquilado'
      WHEN t.tipo_operacion = 'alquiler' AND t.estatus_pago = 'pagado' AND i.estado_inmueble = 'vacacional'
        AND rv.fecha_salida >= CURRENT_DATE THEN 'reservado'
      ELSE NULL
    END
    FROM transacciones t
    LEFT JOIN reservas_vacacionales rv ON rv.transaccion_id = t.id
    WHERE t.inmueble_id = i.id AND t.estatus_pago <> 'cancelado'
    ORDER BY t.fecha_transaccion DESC NULLS LAST, t.id DESC
    LIMIT 1
  ), 'disponible') AS estatus
`;

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
    // Convertir el parámetro estatus en un array de valores de estatus.
    const estatusArray = String(estatus).split(",").map((s) => s.trim()).filter(Boolean);

    if (estatusArray.length) {

      // Construir un placeholder por cada estatus permitido.
      let estatusCantidad= values.length;
      const placeholders = estatusArray.map(() => `$${++estatusCantidad}`).join(", ");
      whereClauses.push(`(
        COALESCE((
          SELECT CASE
            WHEN t.tipo_operacion = 'venta' AND t.estatus_pago = 'pagado' THEN 'vendido'
            WHEN t.tipo_operacion = 'alquiler' AND t.estatus_pago = 'pagado' AND i.estado_inmueble <> 'vacacional' THEN 'alquilado'
            WHEN t.tipo_operacion = 'alquiler' AND t.estatus_pago = 'pagado' AND i.estado_inmueble = 'vacacional'
              AND rv.fecha_salida >= CURRENT_DATE THEN 'reservado'
            ELSE NULL
          END
          FROM transacciones t
          LEFT JOIN reservas_vacacionales rv ON rv.transaccion_id = t.id
          WHERE t.inmueble_id = i.id AND t.estatus_pago <> 'cancelado'
          ORDER BY t.fecha_transaccion DESC NULLS LAST, t.id DESC
          LIMIT 1
        ), 'disponible') IN (${placeholders})
      )`);
      values.push(...estatusArray);
    }
  }

  if (estado_inmueble) {
    values.push(estado_inmueble);
    whereClauses.push(`i.estado_inmueble = $${values.length}`);
  }

  if (min !== undefined && min !== "") {
    values.push(Number(min));
    whereClauses.push(`(i.precio + COALESCE((SELECT av.precio_por_noche FROM alquiler_vacacional av WHERE av.inmueble_id = i.id LIMIT 1), 0)) >= $${values.length}`);
  }

  if (max !== undefined && max !== "") {
    values.push(Number(max));
    whereClauses.push(`(i.precio + COALESCE((SELECT av.precio_por_noche FROM alquiler_vacacional av WHERE av.inmueble_id = i.id LIMIT 1), 0)) <= $${values.length}`);
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

  whereClauses.push(`i.deleted_at IS NULL`);

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
        ) ci
        JOIN caracteristicas c ON c.id = ci.caracteristica_id
      ) AS caracteristicas
      ${ESTATUS_SELECT}
      ${VACACIONAL_SELECT}
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

exports.listInmueblesByCorredor = async (usuarioId) => {
  if (!usuarioId) throw new AppError("usuario_id requerido", 400);

  const sql = `
    SELECT * FROM (
      SELECT
        i.*,
        i.estado_inmueble AS estado_raw,
        INITCAP(REPLACE(i.estado_inmueble, '_', ' ')) AS estado_inmueble,
        ti.nombre AS tipo_inmueble,
        c.nombre  AS ciudad,
        e.nombre  AS estado,
        (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS imagen_url,
        (
          SELECT json_agg(json_build_object('nombre', c2.nombre, 'valor', ci.valor, 'unidad_medicion', c2.unidad_medicion))
          FROM (
            SELECT ci2.caracteristica_id, ci2.valor
            FROM caracteristica_inmueble ci2
            WHERE ci2.inmueble_id = i.id
            ORDER BY ci2.caracteristica_id ASC
          ) ci
          JOIN caracteristicas c2 ON c2.id = ci.caracteristica_id
        ) AS caracteristicas
        ${ESTATUS_SELECT}
        ${VACACIONAL_SELECT}
      FROM inmuebles i
      LEFT JOIN tipos_inmueble ti ON ti.id = i.tipo_inmueble_id
      LEFT JOIN ciudades c ON c.id = i.ciudad_id
      LEFT JOIN estados e ON e.id = c.estado_id
      JOIN corredores co ON co.id = i.corredor_id AND co.usuario_id = $1
      WHERE i.deleted_at IS NULL
    ) sub
    WHERE sub.estatus = 'disponible'
       OR (sub.estado_raw = 'vacacional' AND sub.estatus <> 'vendido')
    ORDER BY sub.id DESC;
  `;

  const { rows } = await pool.query(sql, [usuarioId]);
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
      u.foto_url AS corredor_foto,
      co.usuario_id AS corredor_usuario_id,
      ug.latitud,
      ug.longitud,
      ug.google_maps_url
      ${ESTATUS_SELECT}
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

  if (result.estado_inmueble === "vacacional") {
    const { rows: av } = await pool.query(
      "SELECT id, precio_por_noche, capacidad_personas, noches_minimas, hora_checkin, hora_checkout, permiso_infantes FROM alquiler_vacacional WHERE inmueble_id = $1",
      [id]
    );
    result.alquiler_vacacional = av.length ? av[0] : null;

    if (result.alquiler_vacacional) {
      const { rows: costos } = await pool.query(
        `SELECT c.id AS costo_adicional_id, c.nombre AS costo_adicional_nombre, avc.monto
         FROM alquiler_vacacional_costos_adicionales avc
         JOIN costos_adicionales c ON c.id = avc.costo_adicional_id
         WHERE avc.alquiler_vacacional_id = $1`,
        [result.alquiler_vacacional.id]
      );
      result.costos_adicionales = costos;

      const { rows: mascotas } = await pool.query(
        `SELECT m.id AS mascota_id, m.nombre
         FROM mascotas_alquiler_vacacional mav
         JOIN mascotas m ON m.id = mav.mascota_id
         WHERE mav.alquiler_vacacional_id = $1
         ORDER BY m.id ASC`,
        [result.alquiler_vacacional.id]
      );
      result.mascotas = mascotas;
    }
  }

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
    punto_referencia,
    precio_por_noche,
    capacidad_personas,
    noches_minimas,
    hora_checkin,
    hora_checkout,
    permiso_infantes,
    costos_adicionales,
    mascotas,
  } = data;

  if (!titulo) throw new AppError("titulo es requerido", 400);
  if (!estado_inmueble) throw new AppError("estado_inmueble es requerido", 400);
  if (precio === undefined || precio === null || precio === "") {
    if (estado_inmueble !== "vacacional") throw new AppError("precio es requerido", 400);
  }

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
        estado_inmueble === "vacacional"
          ? (precio === undefined || precio === null || precio === "" ? 0 : Number(precio))
          : Number(precio),
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

    if (estado_inmueble === "vacacional") {
      const { rows: vacRows } = await client.query(
        `INSERT INTO alquiler_vacacional (inmueble_id, precio_por_noche, capacidad_personas, noches_minimas, hora_checkin, hora_checkout, permiso_infantes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id;`,
        [
          inmueble.id,
          Number(precio_por_noche),
          Number(capacidad_personas),
          noches_minimas ? Number(noches_minimas) : 1,
          hora_checkin || null,
          hora_checkout || null,
          permiso_infantes === undefined || permiso_infantes === null ? true : Boolean(permiso_infantes),
        ]
      );
      const alquilerVacacionalId = vacRows[0].id;

      if (mascotas && Array.isArray(mascotas)) {
        for (const m of mascotas) {
          if (m.mascota_id) {
            await client.query(
              `INSERT INTO mascotas_alquiler_vacacional (alquiler_vacacional_id, mascota_id)
               VALUES ($1, $2);`,
              [alquilerVacacionalId, Number(m.mascota_id)]
            );
          }
        }
      }

      if (costos_adicionales && Array.isArray(costos_adicionales)) {
        for (const costo of costos_adicionales) {
          if (costo.costo_adicional_id) {
            await client.query(
              `INSERT INTO alquiler_vacacional_costos_adicionales (alquiler_vacacional_id, costo_adicional_id, monto)
               VALUES ($1, $2, $3);`,
              [
                alquilerVacacionalId,
                Number(costo.costo_adicional_id),
                Number(costo.monto),
              ]
            );
          }
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
          [inmueble.id, "/uploads/properties/" + files[i].filename, orden, portada, "/uploads/properties/" + files[i].filename]
        );

        const imgId = imgRows[0].id;
        const url = `/imagenes/file/${imgId}`;

        await client.query(
          `UPDATE imagenes SET url = $1 WHERE id = $2;`,
          [url, imgId]
        );
      }
    }

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "inmuebles",
        descripcion: `Creación de inmueble ${inmueble.id} ("${inmueble.titulo}")`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");

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

  const client = await pool.connect();
  let inmueble;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(sql, values);
    if (!rows.length) throw new AppError("Inmueble no existe", 404);

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "inmuebles",
        descripcion: `Actualizado inmueble ${id}: ${keys.join(", ")}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    inmueble = rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return inmueble;
};

exports.updateInmueble = async (id, data = {}, files = [], ctx) => {
  if (!id) throw new AppError("id inválido", 400);

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
    punto_referencia,
    latitud,
    longitud,
    caracteristicas,
    precio_por_noche,
    capacidad_personas,
    noches_minimas,
    hora_checkin,
    hora_checkout,
    permiso_infantes,
    costos_adicionales,
    mascotas,
    borrar_imagenes,
  } = data;

  if (!titulo) throw new AppError("titulo es requerido", 400);
  if (!estado_inmueble) throw new AppError("estado_inmueble es requerido", 400);
  if (precio === undefined || precio === null || precio === "") {
    if (estado_inmueble !== "vacacional") throw new AppError("precio es requerido", 400);
  }
  if (estado_inmueble === "vacacional") {
    if (precio_por_noche === undefined || precio_por_noche === null || precio_por_noche === "" || Number(precio_por_noche) <= 0) {
      throw new AppError("precio_por_noche es requerido", 400);
    }
    if (capacidad_personas === undefined || capacidad_personas === null || capacidad_personas === "" || Number(capacidad_personas) <= 0) {
      throw new AppError("capacidad_personas es requerido", 400);
    }
  }

  const client = await pool.connect();

  const rawQuery = client.query.bind(client);
  client.query = async (sql, params) => {
    try {
      return await rawQuery(sql, params);
    } catch (err) {
      err.sql = typeof sql === "string" ? sql : JSON.stringify(sql);
      throw err;
    }
  };

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE inmuebles SET
        titulo = $1,
        descripcion = $2,
        tipo_inmueble_id = $3,
        estado_inmueble = $4,
        precio = $5,
        moneda = $6,
        ciudad_id = $7,
        direccion_exacta = $8,
        area_m2 = $9,
        corredor_id = $10,
        punto_referencia = $11,
        updated_at = NOW()
      WHERE id = $12 AND deleted_at IS NULL
      RETURNING *;`,
      [
        titulo,
        descripcion || null,
        tipo_inmueble_id ? Number(tipo_inmueble_id) : null,
        estado_inmueble,
        estado_inmueble === "vacacional"
          ? (precio === undefined || precio === null || precio === "" ? 0 : Number(precio))
          : Number(precio),
        moneda || "USD",
        ciudad_id ? Number(ciudad_id) : null,
        direccion_exacta || null,
        area_m2 ?? null,
        data.corredor_id ? Number(data.corredor_id) : null,
        punto_referencia || null,
        id
      ]
    );
    if (!rows.length) throw new AppError("Inmueble no existe", 404);
    const inmueble = rows[0];

    /* GPS: reemplazar ubicación */
    await client.query("DELETE FROM ubicaciones_gps WHERE inmueble_id = $1;", [id]);
    if (latitud && longitud) {
      const google_maps_url = `https://maps.google.com/?q=${latitud},${longitud}`;
      await client.query(
        `INSERT INTO ubicaciones_gps (inmueble_id, latitud, longitud, google_maps_url) VALUES ($1, $2, $3, $4);`,
        [id, Number(latitud), Number(longitud), google_maps_url]
      );
    }

    /* Características: reemplazar set completo */
    await client.query("DELETE FROM caracteristica_inmueble WHERE inmueble_id = $1;", [id]);
    if (caracteristicas && Array.isArray(caracteristicas)) {
      for (const c of caracteristicas) {
        if (c.caracteristica_id) {
          await client.query(
            `INSERT INTO caracteristica_inmueble (caracteristica_id, inmueble_id, valor) VALUES ($1, $2, $3);`,
            [Number(c.caracteristica_id), id, c.valor]
          );
        }
      }
    }

    /* Bloque vacacional: eliminado y recreado (o limpio si ya no es vacacional) */
    await client.query("DELETE FROM alquiler_vacacional WHERE inmueble_id = $1;", [id]);
    if (estado_inmueble === "vacacional") {
      const { rows: vacRows } = await client.query(
        `INSERT INTO alquiler_vacacional (inmueble_id, precio_por_noche, capacidad_personas, noches_minimas, hora_checkin, hora_checkout, permiso_infantes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id;`,
        [
          id,
          Number(precio_por_noche),
          Number(capacidad_personas),
          noches_minimas ? Number(noches_minimas) : 1,
          hora_checkin || null,
          hora_checkout || null,
          permiso_infantes === undefined || permiso_infantes === null ? true : Boolean(permiso_infantes),
        ]
      );
      const alquilerVacacionalId = vacRows[0].id;

      if (mascotas && Array.isArray(mascotas)) {
        for (const m of mascotas) {
          if (m.mascota_id) {
            await client.query(
              `INSERT INTO mascotas_alquiler_vacacional (alquiler_vacacional_id, mascota_id)
               VALUES ($1, $2);`,
              [alquilerVacacionalId, Number(m.mascota_id)]
            );
          }
        }
      }

      if (costos_adicionales && Array.isArray(costos_adicionales)) {
        for (const costo of costos_adicionales) {
          if (costo.costo_adicional_id) {
            await client.query(
              `INSERT INTO alquiler_vacacional_costos_adicionales (alquiler_vacacional_id, costo_adicional_id, monto)
               VALUES ($1, $2, $3);`,
              [
                alquilerVacacionalId,
                Number(costo.costo_adicional_id),
                Number(costo.monto),
              ]
            );
          }
        }
      }
    }

    /* Imágenes: borrar marcadas + agregar nuevas */
    if (borrar_imagenes && Array.isArray(borrar_imagenes)) {
      const ids = borrar_imagenes.filter((x) => Number.isFinite(Number(x))).map(Number);
      if (ids.length) {
        await client.query(
          `DELETE FROM imagenes WHERE inmueble_id = $1 AND id = ANY($2);`,
          [id, ids]
        );
      }
    }

    if (files.length) {
      const existing = await client.query(
        "SELECT COALESCE(MAX(orden), 0) AS max_orden FROM imagenes WHERE inmueble_id = $1",
        [id]
      );
      let nextOrden = existing.rows[0].max_orden + 1;

      for (let i = 0; i < files.length; i++) {
        const orden = nextOrden + i;

        const { rows: imgRows } = await client.query(
          `INSERT INTO imagenes (inmueble_id, url, orden, portada, ruta_s3) VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
          [id, "/uploads/properties/" + files[i].filename, orden, false, "/uploads/properties/" + files[i].filename]
        );

        const imgId = imgRows[0].id;
        const url = `/imagenes/file/${imgId}`;

        await client.query(
          `UPDATE imagenes SET url = $1 WHERE id = $2;`,
          [url, imgId]
        );
      }
    }

    /* Recalcular portada: sin portadas marcadas, la de menor orden es la portada */
    await client.query(
      `UPDATE imagenes SET portada = false WHERE inmueble_id = $1;`,
      [id]
    );
    await client.query(
      `UPDATE imagenes SET portada = true WHERE id = (
        SELECT id FROM imagenes WHERE inmueble_id = $1 ORDER BY orden ASC LIMIT 1
      );`,
      [id]
    );

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "inmuebles",
        descripcion: `Actualización completa de inmueble ${id} ("${titulo}")`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");

    return inmueble;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.listDisponiblesPorCiudad = async (ciudadId, q) => {
  if (!ciudadId) throw new AppError("ciudad_id requerido", 400);

  const values = [ciudadId];
  let where = `WHERE i.ciudad_id = $1 AND NOT EXISTS (
    SELECT 1 FROM transacciones t
    WHERE t.inmueble_id = i.id AND t.estatus_pago <> 'cancelado'
  )`;

  if (q) {
    values.push(`%${q}%`);
    where += ` AND (i.titulo ILIKE $${values.length} OR CAST(i.id AS TEXT) LIKE $${values.length})`;
  }

  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, i.precio, i.moneda, i.estado_inmueble, i.corredor_id,
            i.descripcion, i.tipo_inmueble_id, i.area_m2, i.direccion_exacta,
            c.nombre AS ciudad,
            (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS imagen_url,
            (
              SELECT json_agg(json_build_object('nombre', c2.nombre, 'valor', ci.valor, 'unidad_medicion', c2.unidad_medicion))
              FROM (
                SELECT ci2.caracteristica_id, ci2.valor
                FROM caracteristica_inmueble ci2
                WHERE ci2.inmueble_id = i.id
                ORDER BY ci2.caracteristica_id ASC
                LIMIT 4
              ) ci
              JOIN caracteristicas c2 ON c2.id = ci.caracteristica_id
            ) AS caracteristicas
            ${ESTATUS_SELECT}
            ${VACACIONAL_SELECT}
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
    `SELECT i.id, i.titulo, i.precio, i.moneda, i.estado_inmueble, i.corredor_id
            ${ESTATUS_SELECT}
            ${VACACIONAL_SELECT}
     FROM inmuebles i
     LEFT JOIN ciudades c ON c.id = i.ciudad_id
     WHERE c.estado_id = $1 AND NOT EXISTS (
       SELECT 1 FROM transacciones t
       WHERE t.inmueble_id = i.id AND t.estatus_pago <> 'cancelado'
     )
     ORDER BY i.id DESC
     LIMIT 200;`,
    [estadoId]
  );

  return rows;
};

exports.listReservasByInmueble = async (inmuebleId) => {
  if (!inmuebleId) throw new AppError("inmueble_id requerido", 400);

  const { rows } = await pool.query(
    `SELECT
       rv.id,
       rv.cliente_id,
       u.nombre AS cliente_nombre,
       u.email AS cliente_email,
       rv.transaccion_id,
       t.estatus_pago,
       t.monto_total,
       t.moneda,
       rv.fecha_entrada,
       rv.fecha_salida,
       rv.num_huespedes,
       rv.precio_total,
       rv.fecha_reserva
     FROM reservas_vacacionales rv
     JOIN alquiler_vacacional av ON av.id = rv.alquiler_vacacional_id
     JOIN usuarios u ON u.id = rv.cliente_id
     LEFT JOIN transacciones t ON t.id = rv.transaccion_id
     WHERE av.inmueble_id = $1
     ORDER BY rv.fecha_entrada DESC`,
    [Number(inmuebleId)]
  );

  return rows;
};

exports.deleteInmueble = async (id, ctx) => {
  if (!id) throw new AppError("id inválido", 400);

  const client = await pool.connect();
  let eliminado;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE inmuebles
       SET deleted_at = NOW()
       WHERE id = $1
         AND deleted_at IS NULL
       RETURNING id, titulo;`,
      [id]
    );
    if (!rows.length) throw new AppError("Inmueble no existe", 404);

    if (ctx) {
      await auditoriaService.registrarDelete({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "inmuebles",
        descripcion: `Eliminado inmueble ${id}: ${rows[0].titulo}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    eliminado = rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return eliminado;
};
