const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const InmueblesService= require("./inmuebles.service");
const UsuariosService= require("./usuarios.service");
const auditoriaService = require("./auditoria.service");

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
  return rows;
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
  const { inmueble_id, cliente_id, estatus_pago= "pendiente" } = data;

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

  const tipoOperacion = inmueble.estado_inmueble === "venta" ? "venta" : "alquiler";

  const sql = `
    INSERT INTO transacciones (inmueble_id, cliente_id, tipo_operacion, monto_total, moneda, estatus_pago, fecha_transaccion)
    VALUES ($1,$2,$3,$4,$5,$6, NOW())
    RETURNING *;
  `;

  try {
    const { rows } = await pool.query(sql, [inmueble_id, cliente_id, tipoOperacion, inmueble.precio, inmueble.moneda, estatus_pago]);

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "transacciones",
        descripcion: `Creación de transacción para inmueble ${inmueble_id}, cliente ${cliente_id}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      });
    }

    return rows[0];
  } catch (err) {
    throw new AppError(err.message, 400);
  }
};
