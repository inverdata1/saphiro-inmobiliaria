const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const InmueblesService= require("./inmuebles.service");
const UsuariosService= require("./usuarios.service");
const auditoriaService = require("./auditoria.service");

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
  const monto = Number(inmueble.precio);
  if (!monto || isNaN(monto) || monto <= 0) {
    throw new AppError("El inmueble no tiene un precio válido", 400);
  }
  const moneda = String(inmueble.moneda || "USD").toUpperCase();
  if (!["USD", "EUR", "BS"].includes(moneda)) {
    throw new AppError("moneda inválida (use: USD|EUR|BS)", 400);
  }

  const tipoOperacion = inmueble.estado_inmueble === "venta" ? "venta" : "alquiler";
  const monedaUpper = moneda.toUpperCase();

  const client = await pool.connect();
  let transaccion;

  try {
    await client.query("BEGIN");

    const numero_factura = await generarNumeroFactura(client);
    const { rows } = await client.query(
      `INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, monto_total, moneda, estatus_pago, fecha_transaccion, numero_factura)
       VALUES ($1, $2, $3, $4, $5, 'pagado', NOW(), $6)
       RETURNING *`,
      [inmueble_id, cliente_id, tipoOperacion, Number(monto), monedaUpper, numero_factura]
    );
    transaccion = rows[0];

    await client.query(
      `UPDATE transacciones SET estatus_pago = 'pagado' WHERE id = $1`,
      [transaccion.id]
    );

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "transacciones",
        descripcion: `Pago procesado - inmueble ${inmueble_id}, cliente ${cliente_id}, monto ${monto} ${monedaUpper}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw new AppError(err.message, 400);
  } finally {
    client.release();
  }

  return {
    ok: true,
    aprobado: true,
    transaccion_id: transaccion.id,
    monto: Number(monto),
    moneda: monedaUpper,
    tipo_operacion: tipoOperacion,
    inmueble_titulo: inmueble.titulo,
    fecha: new Date().toISOString(),
  };
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

  // El total se calcula SIEMPRE en el servidor (el cliente no lo envía)
  const precioNoche = Number(inmueble.alquiler_vacacional?.precio_por_noche || 0);
  const montoInicial = Number(inmueble.precio) || 0;
  const costoTotal = (inmueble.costos_adicionales || []).reduce(
    (a, c) => a + Number(c.monto || 0),
    0
  );
  const montoTotal = montoInicial + noches * (precioNoche + costoTotal);

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
      [inmueble_id, cliente_id, montoTotal, monedaUpper, estatus_pago, numero_factura]
    );
    const transaccion = txRows[0];

    const { rows: resRows } = await client.query(
      `INSERT INTO reservas_vacacionales (alquiler_vacacional_id, cliente_id, transaccion_id, fecha_entrada, fecha_salida, num_huespedes, precio_total, fecha_reserva)
       VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, NOW())
       RETURNING *`,
      [avId, cliente_id, transaccion.id, fecha_entrada, fecha_salida, huespedes, montoTotal]
    );
    const reserva = resRows[0];

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "reservas_vacacionales",
        descripcion: `Reserva creada para inmueble ${inmueble_id}, cliente ${cliente_id}, del ${fecha_entrada} al ${fecha_salida}, ${huespedes} huéspedes`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    resultado = {
      reserva,
      transaccion,
      inmueble_titulo: inmueble.titulo,
      estado_inmueble: inmueble.estado_inmueble,
      cliente_nombre: cliente.nombre,
    };

    await client.query("COMMIT");
    return resultado;
  } catch (err) {
    await client.query("ROLLBACK");
    throw new AppError(err.message, 400);
  } finally {
    client.release();
  }
};
