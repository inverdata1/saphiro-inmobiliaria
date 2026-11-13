const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const { D, round2, toSql, toNumber, sum } = require("../utils/money");
const InmueblesService = require("./inmuebles.service");
const UsuariosService = require("./usuarios.service");
const auditoriaService = require("./auditoria.service");
const notificacionesService = require("./notificaciones.service");

function luhnAlgorithm(numeroTarjeta) {
  const digitos = String(numeroTarjeta || "").replace(/\D/g, "");
  if (digitos.length < 12 || digitos.length > 19) return false;

  let suma = 0;
  let duplicar = false;
  for (let i = digitos.length - 1; i >= 0; i--) {
    let d = Number(digitos[i]);
    if (duplicar) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    duplicar = !duplicar;
  }
  return suma % 10 === 0;
}

async function generarNumeroFactura(client = pool) {
  const anio = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM transacciones
     WHERE EXTRACT(YEAR FROM fecha_transaccion) = $1`,
    [anio]
  );
  const secuencial = Number(rows[0]?.total || 0) + 1;
  return `FAC-${anio}-${String(secuencial).padStart(5, "0")}`;
}

exports.listTransacciones = async (filters) => {
  const {
    desde,
    hasta,
    tipo_operacion,
    inmueble_id,
    cliente_id,
    corredor_id,
    limit = 100,
    offset = 0,
  } = filters;

  const whereClauses = [];
  const values = [];

  if (desde) {
    values.push(desde);
    whereClauses.push(`t.fecha_transaccion >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    whereClauses.push(`t.fecha_transaccion < ($${values.length}::date + interval '1 day')`);
  }
  if (tipo_operacion) {
    values.push(tipo_operacion);
    whereClauses.push(`t.tipo_operacion = $${values.length}`);
  }
  if (inmueble_id) {
    values.push(Number(inmueble_id));
    whereClauses.push(`t.inmueble_id = $${values.length}`);
  }
  if (cliente_id) {
    values.push(Number(cliente_id));
    whereClauses.push(`t.cliente_id = $${values.length}`);
  }
  if (corredor_id) {
    values.push(Number(corredor_id));
    whereClauses.push(`uc.id = $${values.length}`);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const lim = Math.min(Number(limit || 100), 200);
  const off = Math.max(Number(offset || 0), 0);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN usuarios u ON u.id = t.cliente_id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    LEFT JOIN usuarios uc ON uc.id = co.usuario_id
    ${where};
  `;
  const { rows: countRows } = await pool.query(countSql, values);
  const total = Number(countRows[0]?.total || 0);

  values.push(lim);
  const limIdx = values.length;
  values.push(off);
  const offIdx = values.length;

  const sql = `
    SELECT
      t.*,
      i.titulo AS inmueble_titulo,
      co.usuario_id AS corredor_id,
      u.nombre AS cliente_nombre,
      uc.nombre AS corredor_nombre,
      c.id AS comision_id,
      c.monto_comision,
      c.empresa_ganancia
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN usuarios u ON u.id = t.cliente_id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    LEFT JOIN usuarios uc ON uc.id = co.usuario_id
    ${where}
    ORDER BY t.id DESC
    LIMIT $${limIdx} OFFSET $${offIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return {
    data: rows,
    pagination: { page: Math.floor(off / lim) + 1, limit: lim, offset: off, total },
  };
};

exports.listTransferenciasRecibidas = async (usuario_id, filters = {}) => {
  const { desde, hasta, limit = 100, offset = 0 } = filters;

  const whereClauses = ["co.usuario_id = $1"];
  const values = [Number(usuario_id)];

  if (desde) {
    values.push(desde);
    whereClauses.push(`t.fecha_transaccion >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    whereClauses.push(`t.fecha_transaccion < ($${values.length}::date + interval '1 day')`);
  }

  const where = `WHERE ${whereClauses.join(" AND ")}`;

  const lim = Math.min(Number(limit || 100), 200);
  const off = Math.max(Number(offset || 0), 0);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN inmuebles i ON i.id = t.inmueble_id
    JOIN usuarios u ON u.id = t.cliente_id
    JOIN corredores co ON co.id = c.corredor_id
    ${where};
  `;
  const { rows: countRows } = await pool.query(countSql, values);
  const total = Number(countRows[0]?.total || 0);

  values.push(lim);
  const limIdx = values.length;
  values.push(off);
  const offIdx = values.length;

  const sql = `
    SELECT
      c.id AS transferencia_id,
      c.monto_comision,
      c.empresa_ganancia,
      c.porcentaje_aplicado,
      c.fecha_pago,

      t.id AS transaccion_id,
      t.numero_factura,
      t.tipo_operacion,
      t.monto_total,
      t.moneda,
      t.estatus_pago,
      t.fecha_transaccion,

      i.id     AS inmueble_id,
      i.titulo AS inmueble_titulo,
      (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS inmueble_imagen_url,
      CASE i.estado_inmueble
        WHEN 'alquiler_fijo' THEN 'Alquiler fijo'
        WHEN 'venta' THEN 'Venta'
        WHEN 'vacacional' THEN 'Vacacional'
        ELSE INITCAP(REPLACE(i.estado_inmueble, '_', ' '))
      END AS estado_inmueble,

      u.id     AS cliente_id,
      u.nombre AS cliente_nombre,
      u.email  AS cliente_email,

      -- Desglose por concepto (monto inicial, alquiler por noche, costos adicionales).
      -- Igual que en listTransferenciasRealizadas: JSON en la misma consulta, sin N+1.
      -- Sin lineas da [] y no NULL.
      COALESCE((
        SELECT json_agg(
                 json_build_object('concepto', d.concepto, 'monto', d.monto)
                 ORDER BY d.id
               )
        FROM transacciones_detalles d
        WHERE d.transaccion_id = t.id
      ), '[]'::json) AS detalles
    FROM comisiones c
    JOIN transacciones t ON t.id = c.transaccion_id
    JOIN inmuebles i ON i.id = t.inmueble_id
    JOIN usuarios u ON u.id = t.cliente_id
    JOIN corredores co ON co.id = c.corredor_id
    ${where}
    ORDER BY c.fecha_pago DESC NULLS LAST, c.id DESC
    LIMIT $${limIdx}
    OFFSET $${offIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return {
    data: rows,
    pagination: { page: Math.floor(off / lim) + 1, limit: lim, offset: off, total },
  };
};
exports.listTransferenciasRealizadas = async (usuario_id, filters = {}) => {
  const { desde, hasta, limit = 100, offset = 0 } = filters;

  const whereClauses = ["t.cliente_id = $1"];
  const values = [Number(usuario_id)];

  if (desde) {
    values.push(desde);
    whereClauses.push(`t.fecha_transaccion >= $${values.length}::date`);
  }
  if (hasta) {
    values.push(hasta);
    whereClauses.push(`t.fecha_transaccion < ($${values.length}::date + interval '1 day')`);
  }

  const where = `WHERE ${whereClauses.join(" AND ")}`;

  const lim = Math.min(Number(limit || 100), 200);
  const off = Math.max(Number(offset || 0), 0);

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    ${where};
  `;
  const { rows: countRows } = await pool.query(countSql, values);
  const total = Number(countRows[0]?.total || 0);

  values.push(lim);
  const limIdx = values.length;
  values.push(off);
  const offIdx = values.length;

  const sql = `
    SELECT
      t.id AS transaccion_id,
      t.numero_factura,
      t.tipo_operacion,
      t.monto_total,
      t.moneda,
      t.estatus_pago,
      t.fecha_transaccion,

      i.id     AS inmueble_id,
      i.titulo AS inmueble_titulo,
      (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS inmueble_imagen_url,
      CASE i.estado_inmueble
        WHEN 'alquiler_fijo' THEN 'Alquiler fijo'
        WHEN 'venta' THEN 'Venta'
        WHEN 'vacacional' THEN 'Vacacional'
        ELSE INITCAP(REPLACE(i.estado_inmueble, '_', ' '))
      END AS estado_inmueble,

      co.id AS corredor_id,

      c.monto_comision,
      c.empresa_ganancia,
      c.porcentaje_aplicado AS comision_porcentaje,
      c.fecha_pago AS comision_fecha_pago,

      -- Desglose por concepto (monto inicial, alquiler por noche, costos adicionales).
      -- Va como JSON en la misma consulta: un LEFT JOIN forzaría un agregado con
      -- GROUP BY, y sacarlo en una query por fila sería N+1. Sin lineas da [] y no
      -- NULL, para que el cliente no tenga que distinguir ambos casos.
      COALESCE((
        SELECT json_agg(
                 json_build_object('concepto', d.concepto, 'monto', d.monto)
                 ORDER BY d.id
               )
        FROM transacciones_detalles d
        WHERE d.transaccion_id = t.id
      ), '[]'::json) AS detalles
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN corredores co ON co.id = i.corredor_id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    ${where}
    ORDER BY t.fecha_transaccion DESC NULLS LAST, t.id DESC
    LIMIT $${limIdx}
    OFFSET $${offIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return {
    data: rows,
    pagination: { page: Math.floor(off / lim) + 1, limit: lim, offset: off, total },
  };
};

exports.getTransaccionById = async (id) => {
  if (!Number.isInteger(id)) throw new AppError("ID inválido", 400);

  const sql = `
    SELECT
      t.*,
      i.titulo AS inmueble_titulo,
      i.corredor_id,
      u.nombre AS cliente_nombre,
      c.id AS comision_id,
      c.monto_comision,
      c.empresa_ganancia
    FROM transacciones t
    LEFT JOIN inmuebles i ON i.id = t.inmueble_id
    LEFT JOIN usuarios u ON u.id = t.cliente_id
    LEFT JOIN comisiones c ON c.transaccion_id = t.id
    WHERE t.id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(sql, [id]);
  if (!rows.length) throw new AppError("No existe", 404);
  return rows[0];
};

exports.createTransaccion = async (data, ctx) => {
  const { inmueble_id, cliente_id, estatus_pago = "pendiente", fecha_entrada, fecha_salida } = data;

  if (!inmueble_id) {
    throw new AppError("inmueble_id es obligatorio", 400);
  }

  if(!cliente_id){
    throw new AppError("cliente_id es obligatorio", 400);
  }

  if(isNaN(inmueble_id)){
    throw new AppError("inmueble_id no es un número válido", 400);
  }

  if(isNaN(cliente_id)){
    throw new AppError("cliente_id no es un número válido", 400);
  }

  if (!["pendiente", "pagado"].includes(estatus_pago)) {
    throw new AppError("estatus_pago inválido (use: pendiente|pagado)", 400);
  }

  //traer cliente
  const cliente= await UsuariosService.getUsuarioById(cliente_id);

  if(cliente.rol === "admin"){
    throw new AppError("Un admin no puede ser cliente", 400)
  }

  //traer inmueble
  const inmueble= await InmueblesService.getInmuebleById(inmueble_id);

  if (inmueble.corredor_usuario_id === Number(cliente_id)) {
    throw new AppError("El corredor no puede comprar o alquilar tu propio inmueble", 403);
  }

  if (["alquilado", "vendido"].includes(inmueble.estatus)){
    throw new AppError(`Este inmueble se encuentra ${inmueble.estatus}`, 403);
  }

  // Si el inmueble es alquiler vacacional: fechas obligatorias + chequeo de solapamiento
  if (inmueble.estado_inmueble === "vacacional") {
    if (!fecha_entrada) throw new AppError("fecha_entrada es obligatoria para inmuebles vacacionales", 400);
    if (!fecha_salida) throw new AppError("fecha_salida es obligatoria para inmuebles vacacionales", 400);

    const entrada = new Date(fecha_entrada + "T00:00:00");
    const salida = new Date(fecha_salida + "T00:00:00");
    if (isNaN(entrada.getTime()) || isNaN(salida.getTime())) {
      throw new AppError("fechas inválidas (use formato YYYY-MM-DD)", 400);
    }
    if (salida <= entrada) {
      throw new AppError("fecha_salida debe ser posterior a fecha_entrada", 400);
    }

    const avId = inmueble.alquiler_vacacional?.id;
    if (!avId) {
      throw new AppError("El inmueble no tiene configuración vacacional", 400);
    }

    const { rows: overlap } = await pool.query(
      `SELECT rv.id
       FROM reservas_vacacionales rv
       LEFT JOIN transacciones t ON t.id = rv.transaccion_id
       WHERE rv.alquiler_vacacional_id = $1
         AND (t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado')
         AND rv.fecha_entrada < $2::date
         AND rv.fecha_salida > $3::date
       LIMIT 1`,
      [avId, fecha_salida, fecha_entrada]
    );
    if (overlap.length) {
      throw new AppError("Ya existe una reserva que se solapa con las fechas seleccionadas", 409);
    }
  }

  const tipoOperacion = inmueble.estado_inmueble === "venta" ? "venta" : "alquiler";

  const sql = `
    INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, monto_total, moneda, estatus_pago, fecha_transaccion, numero_factura)
    VALUES ($1,$2,$3,$4,$5,$6, NOW(), $7)
    RETURNING *;
  `;

  const client = await pool.connect();
  let transaccion;

  try {
    await client.query("BEGIN");

    const numeroFactura = await generarNumeroFactura(client);

    const { rows } = await client.query(sql, [inmueble_id, cliente_id, tipoOperacion, inmueble.precio, inmueble.moneda, estatus_pago, numeroFactura]);

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "transacciones",
        descripcion: `Creación de transacción para inmueble ${inmueble_id}, cliente ${cliente_id}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    transaccion = rows[0];

    await client.query("COMMIT");
    return transaccion;
  } catch (err) {
    await client.query("ROLLBACK");
    throw new AppError(err.message, 400);
  } finally {
    client.release();
  }
};

exports.procesarPago = async (data, ctx) => {
  const {
    inmueble_id,
    cliente_id,
  } = data;

  if (!inmueble_id || !cliente_id) {
    throw new AppError("inmueble_id y cliente_id son requeridos", 400);
  }

  const cliente = await UsuariosService.getUsuarioById(Number(cliente_id));
  if (cliente.rol === "admin") {
    throw new AppError("Un admin no puede ser cliente", 403);
  }

  const inmueble = await InmueblesService.getInmuebleById(Number(inmueble_id));
  if (inmueble.corredor_usuario_id === Number(cliente_id)) {
    throw new AppError("No puedes comprar o alquilar tu propio inmueble", 403);
  }

  if (inmueble.estado_inmueble === "vacacional") {
    throw new AppError("Los inmuebles vacacionales se pagan mediante reserva", 400);
  }

  // Precio y moneda SIEMPRE provienen del servidor (el cliente no los envía)
  const esAlquilerFijo = inmueble.estado_inmueble === "alquiler_fijo";

  // `precio` llega como 0 (no null) cuando el inmueble no cobra monto inicial, así que
  // el NaN se resuelve a 0 y el guard final `monto <= 0` sigue cubriendo el caso simple.
  const precioBase = D(inmueble.precio);
  if (precioBase.lt(0)) {
    throw new AppError("El inmueble no tiene un precio válido", 400);
  }

  // Alquiler fijo: el monto de la operación es el mes administrativo + la primera mensualidad
  const alquilerFijo = esAlquilerFijo ? inmueble.alquiler_fijo : null;
  const precioMes = esAlquilerFijo ? D(alquilerFijo?.precio_mes) : D(0);
  if (esAlquilerFijo && precioMes.lte(0)) {
    throw new AppError("El inmueble no tiene un precio de alquiler fijo válido", 400);
  }

  // Suma exacta en base 10 y redondeo recién al final: el `precioBase + precioMes` con
  // Number podía dar 1849.9999999999998 y guardarse como 1849.99 en vez de 1850.00.
  const monto = round2(esAlquilerFijo ? precioBase.plus(precioMes) : precioBase);
  if (monto.lte(0)) {
    throw new AppError("El inmueble no tiene un precio válido", 400);
  }
  const moneda = String(inmueble.moneda || "USD").toUpperCase();
  if (!["USD", "EUR", "BS"].includes(moneda)) {
    throw new AppError("moneda inválida (use: USD|EUR|BS)", 400);
  }

  const tipoOperacion = inmueble.estado_inmueble === "venta" ? "venta" : "alquiler";
  const monedaUpper = moneda.toUpperCase();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const numero_factura = await generarNumeroFactura(client);
    const { rows } = await client.query(
      `INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, monto_total, moneda, estatus_pago, fecha_transaccion, numero_factura)
       VALUES ($1, $2, $3, $4, $5, 'pagado', NOW(), $6)
       RETURNING *`,
      [inmueble_id, cliente_id, tipoOperacion, toSql(monto), monedaUpper, numero_factura]
    );
    const transaccion = rows[0];

    await client.query(
      `UPDATE transacciones SET estatus_pago = 'pagado' WHERE id = $1`,
      [transaccion.id]
    );

    // Alquiler fijo: contrato en `contrato` + TODAS las cuotas del plazo en mensualidades
    // (cuota 1 = la que cubre este pago, 2..cantidad_meses pendientes de cobro).
    let contrato = null;
    let mensualidad = null;
    let mensualidadesCreadas = 0;
    if (esAlquilerFijo) {
      // Al menos 1: el contrato siempre arranca con la cuota que se paga ahora. Sin el
      // Math.max, un cantidad_meses inválido (0, NaN, negativo) dejaría al contrato con
      // un INSERT de cuotas vacío y la transacción quedaría sin mensualidad vinculada.
      const cantidadMeses = Math.max(1, Number(alquilerFijo.cantidad_meses) || 1);

      const { rows: ct } = await client.query(
        `INSERT INTO contrato (usuario_id, alquiler_fijo_id, precio_mensualidad, cantidad_meses, moneda, fecha_inicio, active)
         VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)
         RETURNING *`,
        [cliente_id, alquilerFijo.id, toSql(precioMes), cantidadMeses, monedaUpper]
      );
      contrato = ct[0];

      // Las N cuotas salen de un solo INSERT ... SELECT con GENERATE_SERIES: una sentencia,
      // sin loop en Node ni N idas y vueltas. `monto_meta` de cada cuota es la mensualidad,
      // NO el total de la transacción: la cuota 1 además incluye el mes administrativo, que
      // ya queda en transacciones.monto_total. La cuota 1 nace 'pagado' con monto_pagado
      // completo; las 2..N nacen 'pendiente' con monto_pagado 0, listas para cobrarse mes a mes.
      // periodo_mes/anio salen de CURRENT_DATE (pool en America/Caracas) para no depender de
      // la zona horaria del proceso Node, avanzando un mes por cuota; el salto de año lo
      // resuelve la aritmética de fechas de Postgres.
      const { rows: men } = await client.query(
        `INSERT INTO mensualidades (contrato_id, numero_cuota, periodo_mes, periodo_anio, monto_meta, monto_pagado, estado)
         SELECT
           $1,
           n,
           EXTRACT(MONTH FROM (CURRENT_DATE + make_interval(months => n - 1)))::int,
           EXTRACT(YEAR  FROM (CURRENT_DATE + make_interval(months => n - 1)))::int,
           $2::numeric,
           CASE WHEN n = 1 THEN $2::numeric ELSE 0 END,
           CASE WHEN n = 1 THEN 'pagado' ELSE 'pendiente' END
         FROM GENERATE_SERIES(1, $3::int) AS n
         RETURNING *`,
        [contrato.id, toSql(precioMes), cantidadMeses]
      );
      mensualidadesCreadas = men.length;
      // La cuota 1 es la que cubre este pago: es la que se vincula a la transacción.
      mensualidad = men.find((m) => Number(m.numero_cuota) === 1) || men[0];

      // Vincula el pago (transacción) con la cuota cobrada (tabla puente de la migración 019).
      await client.query(
        `INSERT INTO transaccion_mensualidades (transaccion_id, mensualidad_id)
         VALUES ($1, $2)`,
        [transaccion.id, mensualidad.id]
      );
    }

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "transacciones",
        descripcion: `Pago procesado - inmueble ${inmueble_id}, cliente ${cliente_id}, monto ${toSql(monto)} ${monedaUpper}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await notificacionesService.createToAllAdmins({
      titulo: "Transaccion exitosa",
      descripcion: `Transaccion exitosa para inmueble ${inmueble.titulo} al precio de ${toSql(monto)} ${monedaUpper} 
       por el cliente ${cliente.nombre}`,
      tipo_notificacion: "Transaccion",
    });

    // El payload se arma ANTES del COMMIT a propósito. Con el return después del COMMIT,
    // cualquier error al construirlo devolvía 500 con el cobro yaPersistido, y como
    // withIdempotency borra la key cuando el handler lanza, el reintento del cliente
    // duplicaba el pago. Armándolo acá, ese error cae en el ROLLBACK de abajo.
    const response = {
      ok: true,
      aprobado: true,
      transaccion_id: transaccion.id,
      monto: toNumber(monto),
      moneda: monedaUpper,
      tipo_operacion: tipoOperacion,
      inmueble_titulo: inmueble.titulo,
      fecha: new Date().toISOString(),
      ...(contrato
        ? {
            contrato_id: contrato.id,
            mensualidad_id: mensualidad?.id ?? null,
            numero_cuota: mensualidad?.numero_cuota ?? null,
            monto_cuota: toNumber(mensualidad?.monto_meta ?? precioMes),
            cantidad_meses: Number(contrato.cantidad_meses),
            mensualidades_creadas: mensualidadesCreadas,
          }
        : {}),
    };

    await client.query("COMMIT");
    return response;
  } catch (err) {
    await client.query("ROLLBACK");
    // Se preserva el status de los AppError propios (404/403/409): re-envolverlos como 400,
    // como hace `procesarPago`, convierte "ya está pagada" en "solicitud inválida".
    throw err instanceof AppError ? err : new AppError(err.message, 400);
  } finally {
    client.release();
  }
};

// Pago de una cuota de alquiler fijo (las mensualidades 2..N que crea `procesarPago`).
// La cuota 1 se cobra junto al mes administrativo; acá cada request cobra una cuota.
//
// El monto lo calcula el servidor (`monto_meta - monto_pagado` de la cuota), no el cliente:
// el body no puede pagar de menos ni de más. `monto` es opcional y solo permite pagar MENOS
// (abono parcial → estado 'pagado_parcial'); pagar por encima de lo que resta se rechaza.
exports.pagarMensualidad = async (data, ctx) => {
  const { mensualidad_id, monto: montoBody } = data || {};

  const mensualidadId = Number(mensualidad_id);
  if (!Number.isInteger(mensualidadId) || mensualidadId <= 0) {
    throw new AppError("mensualidad_id inválido", 400);
  }

  // El arrendatario sale de la sesión (JWT), no del body: el body no elige a nombre de
  // quién se paga. Un request directo con `cliente_id` ajeno quedaba fuera de control.
  const clienteId = Number(ctx?.usuario_id);
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new AppError("Sesión requerida para pagar una mensualidad", 401);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // FOR UPDATE: sin el lock, dos pagos concurrentes de la misma cuota leen el mismo
    // `monto_pagado`, pasan los dos el guard de "pendiente" y la cobran dos veces.
    const { rows: mRows } = await client.query(
      `SELECT m.id, m.contrato_id, m.numero_cuota, m.periodo_mes, m.periodo_anio,
              m.monto_meta, m.monto_pagado, m.estado,
              ct.usuario_id, ct.moneda, ct.active,
              af.inmueble_id,
              i.titulo AS inmueble_titulo
         FROM mensualidades m
         JOIN contrato ct ON ct.id = m.contrato_id
         JOIN alquiler_fijo af ON af.id = ct.alquiler_fijo_id
         JOIN inmuebles i ON i.id = af.inmueble_id
        WHERE m.id = $1
        FOR UPDATE OF m`,
      [mensualidadId]
    );
    if (!mRows.length) throw new AppError("Mensualidad no encontrada", 404);

    const mensualidad = mRows[0];

    if (Number(mensualidad.usuario_id) !== clienteId) {
      throw new AppError("Esta mensualidad no pertenece a un contrato tuyo", 403);
    }
    if (!mensualidad.active) {
      throw new AppError("El contrato no está activo", 409);
    }
    if (mensualidad.estado === "pagado") {
      throw new AppError(`La cuota ${mensualidad.numero_cuota} ya está pagada`, 409);
    }

    const moneda = String(mensualidad.moneda || "").toUpperCase();
    if (!["USD", "EUR", "BS"].includes(moneda)) {
      throw new AppError("El contrato tiene una moneda inválida", 400);
    }

    const montoMeta = round2(mensualidad.monto_meta);
    const pagadoPrevio = round2(mensualidad.monto_pagado || 0);
    const restante = montoMeta.minus(pagadoPrevio);
    if (restante.lte(0)) {
      // Datos incoherentes (saldo 0 con estado distinto de 'pagado'): no hay nada que cobrar.
      throw new AppError("La cuota no tiene monto pendiente", 409);
    }

    // Sin `monto` se cobra la cuota completa; con `monto`, un abono parcial.
    const montoPago =
      montoBody === undefined || montoBody === null ? restante : round2(montoBody);
    if (montoPago.lte(0)) {
      throw new AppError("monto inválido", 400);
    }
    if (montoPago.gt(restante)) {
      throw new AppError(`El monto excede lo que resta de la cuota (${toSql(restante)} ${moneda})`, 400);
    }

    // `gte` (y no `eq`): si el cliente abona el resto, la comparación con Decimal es exacta
    // y la cuota cierra en 'pagado' sin quedar a un centavo de distancia.
    const nuevoPagado = pagadoPrevio.plus(montoPago);
    const nuevoEstado = nuevoPagado.gte(montoMeta) ? "pagado" : "pagado_parcial";

    const numero_factura = await generarNumeroFactura(client);
    // Estatus 'pagado' desde el INSERT: el trigger AFTER INSERT ya crea la comisión del
    // corredor sobre `monto_total`. No hace falta el UPDATE redundante de `procesarPago`
    // (el AFTER UPDATE sale temprano cuando el estatus no cambió).
    const { rows: txRows } = await client.query(
      `INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, monto_total, moneda, estatus_pago, fecha_transaccion, numero_factura)
       VALUES ($1, $2, 'alquiler', $3, $4, 'pagado', NOW(), $5)
       RETURNING *`,
      [mensualidad.inmueble_id, clienteId, toSql(montoPago), moneda, numero_factura]
    );
    const transaccion = txRows[0];

    const { rows: cuotaRows } = await client.query(
      `UPDATE mensualidades
          SET monto_pagado = $2, estado = $3
        WHERE id = $1
        RETURNING *`,
      [mensualidadId, toSql(nuevoPagado), nuevoEstado]
    );
    const cuota = cuotaRows[0];

    // Tabla puente de la migración 019: un pago (transacción) puede cubrir una cuota, y una
    // cuota parcial acumula varios pagos.
    await client.query(
      `INSERT INTO transaccion_mensualidades (transaccion_id, mensualidad_id)
       VALUES ($1, $2)`,
      [transaccion.id, cuota.id]
    );

    // Desglose de una sola línea con la cuota pagada. El recibo suma estas líneas y las
    // compara con `monto_total` (MisRecibosPage): con una línea que es exactamente el monto
    // cobrado nunca cae en la fila de "Otros conceptos no desglosados". El concepto se
    // recorta a VARCHAR(50) porque Postgres errora, no trunca.
    const detalles = [
      {
        concepto: `Cuota ${cuota.numero_cuota} (${String(cuota.periodo_mes).padStart(2, "0")}/${cuota.periodo_anio})`,
        monto: toNumber(montoPago),
      },
    ].map((d) => ({ concepto: d.concepto.slice(0, 50), monto: toNumber(d.monto) }));

    await client.query(
      `INSERT INTO transacciones_detalles (transaccion_id, concepto, monto)
       SELECT $1::int, d.concepto, d.monto
       FROM jsonb_to_recordset($2::jsonb) AS d(concepto VARCHAR(50), monto NUMERIC(10,2))`,
      [transaccion.id, JSON.stringify(detalles)]
    );

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "mensualidades",
        descripcion: `Pago de mensualidad - contrato ${cuota.contrato_id}, cuota ${cuota.numero_cuota} (periodo ${cuota.periodo_mes}/${cuota.periodo_anio}), monto ${toSql(montoPago)} ${moneda}, saldo ${toSql(montoMeta.minus(nuevoPagado))} ${moneda}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await notificacionesService.createToAllAdmins({
      titulo: "Pago de mensualidad",
      descripcion: `Pago de la cuota ${cuota.numero_cuota} (${cuota.periodo_mes}/${cuota.periodo_anio}) del inmueble ${mensualidad.inmueble_titulo} por ${toSql(montoPago)} ${moneda} del cliente ${clienteId}`,
      tipo_notificacion: "Transaccion",
    });

    // El payload se arma ANTES del COMMIT a propósito: cualquier error al construirlo cae en
    // el ROLLBACK y no deja el cobro persistido con la key de idempotencia borrada.
    const response = {
      ok: true,
      aprobado: true,
      transaccion_id: transaccion.id,
      numero_factura,
      contrato_id: cuota.contrato_id,
      mensualidad_id: cuota.id,
      numero_cuota: cuota.numero_cuota,
      periodo_mes: cuota.periodo_mes,
      periodo_anio: cuota.periodo_anio,
      monto: toNumber(montoPago),
      moneda,
      monto_meta: toNumber(montoMeta),
      monto_pagado: toNumber(nuevoPagado),
      saldo_cuota: toNumber(montoMeta.minus(nuevoPagado)),
      estado_cuota: cuota.estado,
      inmueble_id: mensualidad.inmueble_id,
      inmueble_titulo: mensualidad.inmueble_titulo,
      fecha: new Date().toISOString(),
    };

    await client.query("COMMIT");
    return response;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err instanceof AppError ? err : new AppError(err.message, 400);
  } finally {
    client.release();
  }
};

exports.crearReserva = async (data, ctx) => {
  const {
    inmueble_id,
    cliente_id,
    fecha_entrada,
    fecha_salida,
    moneda,
    num_huespedes = 1,
    estatus_pago = "pendiente",
    mascotas,
    costos_adicionales,
  } = data;

  if (!inmueble_id) throw new AppError("inmueble_id es obligatorio", 400);
  if (!cliente_id) throw new AppError("cliente_id es obligatorio", 400);
  if (!fecha_entrada) throw new AppError("fecha_entrada es obligatoria", 400);
  if (!fecha_salida) throw new AppError("fecha_salida es obligatoria", 400);

  if (isNaN(inmueble_id)) throw new AppError("inmueble_id no es un número válido", 400);
  if (isNaN(cliente_id)) throw new AppError("cliente_id no es un número válido", 400);

  if (isNaN(num_huespedes) || Number(num_huespedes) <= 0) {
    throw new AppError("num_huespedes inválido", 400);
  }

  if (!moneda || !["USD", "EUR", "BS"].includes(moneda.toUpperCase())) {
    throw new AppError("moneda inválida (use: USD|EUR|BS)", 400);
  }

  if (!["pendiente", "pagado"].includes(estatus_pago)) {
    throw new AppError("estatus_pago inválido (use: pendiente|pagado)", 400);
  }

  const entrada = new Date(fecha_entrada + "T00:00:00");
  const salida = new Date(fecha_salida + "T00:00:00");
  if (isNaN(entrada.getTime()) || isNaN(salida.getTime())) {
    throw new AppError("fechas inválidas (use formato YYYY-MM-DD)", 400);
  }
  if (salida <= entrada) {
    throw new AppError("fecha_salida debe ser posterior a fecha_entrada", 400);
  }

  const cliente = await UsuariosService.getUsuarioById(Number(cliente_id));

  if (cliente.rol === "admin") {
    throw new AppError("Un admin no puede ser cliente", 403);
  }

  const inmueble = await InmueblesService.getInmuebleById(Number(inmueble_id));
  if (inmueble.estado_inmueble !== "vacacional") {
    throw new AppError("El inmueble no es de tipo vacacional", 400);
  }
  if (inmueble.corredor_usuario_id === Number(cliente_id)) {
    throw new AppError("No puedes reservar tu propio inmueble", 403);
  }

  const avId = inmueble.alquiler_vacacional?.id;
  if (!avId) {
    throw new AppError("El inmueble no tiene configuración vacacional", 400);
  }

  // Validar solapamiento con reservas existentes (ignora transacciones canceladas)
  const { rows: overlap } = await pool.query(
    `SELECT rv.id
     FROM reservas_vacacionales rv
     LEFT JOIN transacciones t ON t.id = rv.transaccion_id
     WHERE rv.alquiler_vacacional_id = $1
       AND (t.estatus_pago IS NULL OR t.estatus_pago <> 'cancelado')
       AND rv.fecha_entrada < $2::date
       AND rv.fecha_salida > $3::date
     LIMIT 1`,
    [avId, fecha_salida, fecha_entrada]
  );
  if (overlap.length) {
    throw new AppError("Ya existe una reserva que se solapa con las fechas seleccionadas", 409);
  }

  const capacidad = Number(inmueble.alquiler_vacacional?.capacidad_personas || 1);
  const huespedes = Number(num_huespedes);
  if (huespedes > capacidad) {
    throw new AppError(`Los huéspedes no pueden exceder la capacidad del inmueble (${capacidad})`, 400);
  }

  const nochesMin = Number(inmueble.alquiler_vacacional?.noches_minimas || 1);
  const noches = Math.round((salida - entrada) / 86400000);
  if (noches < nochesMin) {
    throw new AppError(`La estancia debe ser de mínimo ${nochesMin} noche(s)`, 400);
  }

  // Mascotas: [{ mascota_id, cantidad }]. El cliente puede omitir `cantidad` (=1) pero el
  // tipo tiene que ser uno de los que el inmueble permite, y el total no puede pasar el
  // cupo. Se valida acá y no solo en el frontend porque un request directo se los salta.
  const mascotasPermitidas = Array.isArray(inmueble.mascotas) ? inmueble.mascotas : [];
  const cupoMascotas = Number(inmueble.alquiler_vacacional?.cantidad_mascotas_permitidas || 0);

  let mascotasReserva = [];
  if (mascotas !== undefined && mascotas !== null) {
    if (!Array.isArray(mascotas)) {
      throw new AppError("mascotas debe ser un arreglo", 400);
    }
    if (mascotas.length > 0 && mascotasPermitidas.length === 0) {
      throw new AppError("Este inmueble no permite mascotas", 400);
    }

    const vistos = new Set();
    for (const m of mascotas) {
      const id = Number(m?.mascota_id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("mascota_id inválido en la lista de mascotas", 400);
      }
      if (!mascotasPermitidas.some((p) => Number(p.mascota_id) === id)) {
        const nombre = mascotasPermitidas.map((p) => p.nombre).join(", ");
        throw new AppError(`La mascota indicada no está permitida en este inmueble (${nombre})`, 400);
      }
      if (vistos.has(id)) {
        throw new AppError("La misma mascota no puede repetirse en la lista", 400);
      }
      vistos.add(id);

      const cantidad = m?.cantidad === undefined ? 1 : Number(m.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        throw new AppError("La cantidad de mascotas debe ser un entero mayor a 0", 400);
      }
      mascotasReserva.push({ mascota_id: id, cantidad });
    }

    const totalMascotas = mascotasReserva.reduce((a, m) => a + m.cantidad, 0);
    if (cupoMascotas > 0 && totalMascotas > cupoMascotas) {
      throw new AppError(
        `Las mascotas no pueden exceder el cupo del inmueble (${cupoMascotas})`,
        400
      );
    }
  }

  // Costos adicionales: el huésped marca cuáles quiere contratar. Si el campo NO llega
  // (clientes viejos que no lo envían) se cobran todos, igual que antes; si llega, solo
  // los indicados. Se valida acá y no solo en el frontend porque un request directo se
  // saltaría el checkbox y podría mandar ids que el inmueble no tiene.
  const costosDisponibles = Array.isArray(inmueble.costos_adicionales)
    ? inmueble.costos_adicionales
    : [];

  let costosReserva = [];
  if (costos_adicionales === undefined || costos_adicionales === null) {
    costosReserva = costosDisponibles.map((c) => ({
      costo_adicional_id: Number(c.costo_adicional_id),
      nombre: c.costo_adicional_nombre,
      monto: Number(c.monto || 0),
    }));
  } else {
    if (!Array.isArray(costos_adicionales)) {
      throw new AppError("costos_adicionales debe ser un arreglo", 400);
    }

    const vistos = new Set();
    for (const c of costos_adicionales) {
      const id = Number(c?.costo_adicional_id ?? c);
      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("costo_adicional_id inválido en la lista de costos", 400);
      }
      if (vistos.has(id)) {
        throw new AppError("El mismo costo adicional no puede repetirse en la lista", 400);
      }
      vistos.add(id);

      const encontrado = costosDisponibles.find((d) => Number(d.costo_adicional_id) === id);
      if (!encontrado) {
        throw new AppError(
          `El costo adicional ${id} no está configurado en este inmueble`,
          400
        );
      }
      costosReserva.push({
        costo_adicional_id: id,
        nombre: encontrado.costo_adicional_nombre,
        monto: Number(encontrado.monto || 0),
      });
    }
  }

  // El total se calcula SIEMPRE en el servidor (el cliente no lo envía)
  const precioNoche = D(inmueble.alquiler_vacacional?.precio_por_noche);
  const montoInicial = D(inmueble.precio);
  // Solo los costos marcados: los que no se contratan no se cobran.
  const costoTotal = sum(costosReserva, (c) => c.monto);
  const montoTotal = round2(montoInicial.plus(D(noches).times(precioNoche.plus(costoTotal))));

  const monedaUpper = moneda.toUpperCase();

  const client = await pool.connect();
  let resultado;

  try {
    await client.query("BEGIN");

    const numero_factura = await generarNumeroFactura(client);

    const { rows: txRows } = await client.query(
      `INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, monto_total, moneda, estatus_pago, fecha_transaccion, numero_factura)
       VALUES ($1, $2, 'alquiler', $3, $4, $5, NOW(), $6)
       RETURNING *`,
      [inmueble_id, cliente_id, toSql(montoTotal), monedaUpper, estatus_pago, numero_factura]
    );
    const transaccion = txRows[0];

    const { rows: resRows } = await client.query(
      `INSERT INTO reservas_vacacionales (alquiler_vacacional_id, cliente_id, transaccion_id, fecha_entrada, fecha_salida, num_huespedes, precio_total, fecha_reserva)
       VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, NOW())
       RETURNING *`,
      [avId, cliente_id, transaccion.id, fecha_entrada, fecha_salida, huespedes, toSql(montoTotal)]
    );
    const reserva = resRows[0];

    await client.query(
      `UPDATE inmuebles SET estatus = 'reservado' WHERE id = $1 AND estatus = 'disponible'`,
      [inmueble_id]
    );

    // Mascotas de la reserva. Va después de tener `reserva.id` porque la tabla cuelga de
    // la reserva, no de la transacción. Todas en el mismo INSERT: si una falla el
    // ROLLBACK de abajo se lleva la reserva entera.
    if (mascotasReserva.length > 0) {
      await client.query(
        `INSERT INTO reservas_mascotas (reserva_id, mascota_id, cantidad)
         SELECT $1::int, m.mascota_id, m.cantidad
         FROM jsonb_to_recordset($2::jsonb) AS m(mascota_id INTEGER, cantidad INTEGER)`,
        [reserva.id, JSON.stringify(mascotasReserva)]
      );
    }

    // Desglose de la transacción. La idea es que la SUMA de estas líneas dé exactamente
    // `monto_total`, así que van las tres partes del total: el monto inicial, el alquiler
    // por noche y los costos adicionales contratados. Antes solo se guardaban los extras,
    // con lo cual las líneas no alcanzaban ni a reconstruir el monto.
    //
    // Las etiquetas de las dos primeras replican el "Resumen del costo" del frontend, para
    // que el comprobante y la base digan lo mismo. El concepto se recorta a VARCHAR(50)
    // porque Postgres ERRORA (no trunca) si el nombre del catálogo se pasa del límite; las
    // líneas de base son cortas por construcción, pero el recorte va igual.
    const detallesReserva = [
      { concepto: "Monto inicial", monto: montoInicial },
      {
        concepto: `${noches} noche${noches > 1 ? "s" : ""} × ${precioNoche}`,
        monto: D(noches).times(precioNoche),
      },
      ...costosReserva.map((c) => ({
        concepto: String(c.nombre || `Costo ${c.costo_adicional_id}`),
        monto: D(noches).times(D(c.monto)),
      })),
    ]
      // Las líneas de monto 0 no aportan nada al desglose, solo ruido: si el inmueble no
      // cobra monto inicial no hay por qué guardar una línea "Monto inicial" en 0.
      .filter((d) => d.monto.gt(0))
      .map((d) => ({
        concepto: d.concepto.slice(0, 50),
        monto: toNumber(d.monto),
      }));

    if (detallesReserva.length > 0) {
      await client.query(
        `INSERT INTO transacciones_detalles (transaccion_id, concepto, monto)
         SELECT $1::int, d.concepto, d.monto
         FROM jsonb_to_recordset($2::jsonb) AS d(concepto VARCHAR(50), monto NUMERIC(10,2))`,
        [transaccion.id, JSON.stringify(detallesReserva)]
      );
    }

    if (ctx) {
      const detalleCostos = costosReserva.length
        ? `, costos: ${costosReserva.map((c) => c.nombre).join(", ")}`
        : "";
      const detalleMascotas = mascotasReserva.length
        ? `, ${mascotasReserva
            .map((m) => {
              const nombre = mascotasPermitidas.find((p) => Number(p.mascota_id) === m.mascota_id)?.nombre;
              return `${m.cantidad} ${nombre || `mascota ${m.mascota_id}`}`;
            })
            .join(", ")}`
        : "";
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "reservas_vacacionales",
        descripcion: `Reserva creada para inmueble ${inmueble_id}, cliente ${cliente_id}, del ${fecha_entrada} al ${fecha_salida}, ${huespedes} huéspedes${detalleMascotas}${detalleCostos}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await notificacionesService.createToAllAdmins({
      titulo: "Nueva reserva",
      descripcion: `Reserva creada para inmueble ${inmueble.titulo} al precio de ${toSql(montoTotal)} ${monedaUpper},
       por el cliente ${cliente.nombre} desde la fecha ${fecha_entrada} hasta la fecha ${fecha_salida}`,
      tipo_notificacion: "Transaccion",
    });

    resultado = {
      reserva,
      transaccion,
      inmueble_titulo: inmueble.titulo,
      estado_inmueble: inmueble.estado_inmueble,
      cliente_nombre: cliente.nombre,
      mascotas: mascotasReserva,
      costos_aplicados: costosReserva,
      detalles: detallesReserva,
    };

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw new AppError(err.message, 400);
  } finally {
    client.release();
  }

  return resultado
};
