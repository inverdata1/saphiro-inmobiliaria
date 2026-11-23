const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const notificaciones = require("./notificaciones.service");

const SELECT = `
  SELECT c.id, c.inmueble_id, c.cliente_id, c.estado, c.fecha, c.hora, c.created_at,
         i.titulo AS inmueble_titulo, i.uuid AS inmueble_uuid,
         u.nombre AS cliente_nombre,
         co.usuario_id AS corredor_usuario_id
    FROM citas_visita c
    JOIN inmuebles i ON i.id = c.inmueble_id
    JOIN usuarios u ON u.id = c.cliente_id
    LEFT JOIN corredores co ON co.id = i.corredor_id
`;

function puedeGestionar(user, cita) {
  if (!user) return false;
  if (user.rol === "admin") return true;
  return Number(user.id) === Number(cita.corredor_usuario_id);
}

async function cargar(id) {
  const { rows } = await pool.query(`${SELECT} WHERE c.id = $1`, [Number(id)]);
  if (!rows.length) throw new AppError("Cita no encontrada", 404);
  return rows[0];
}

exports.solicitar = async (inmuebleId, user) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.titulo, co.usuario_id AS corredor_usuario_id, u.nombre AS cliente
       FROM inmuebles i
       JOIN usuarios u ON u.id = $2
       LEFT JOIN corredores co ON co.id = i.corredor_id
      WHERE i.id = $1 AND i.deleted_at IS NULL`,
    [Number(inmuebleId), user.id]
  );
  const row = rows[0];
  if (!row) throw new AppError("Inmueble no encontrado", 404);
  if (Number(row.corredor_usuario_id) === Number(user.id)) {
    throw new AppError("No puedes pedirte una cita de tu propio inmueble", 400);
  }
  const { rows: created } = await pool.query(
    `INSERT INTO citas_visita (inmueble_id, cliente_id, estado)
     VALUES ($1, $2, 'solicitada')
     RETURNING id`,
    [row.id, user.id]
  );
  const id = created[0].id;
  const nota = `${row.cliente} quiere una cita para ver ${row.titulo}.`;
  const enlace = `/citas?cita=${id}`;
  await notificaciones.createToAllAdmins({
    titulo: "Cita para ver un inmueble",
    descripcion: nota,
    tipo_notificacion: "Transaccion",
    enlace,
  });
  if (row.corredor_usuario_id) {
    await notificaciones.create({
      usuario_id: row.corredor_usuario_id,
      titulo: "Cita para ver un inmueble",
      descripcion: nota,
      tipo_notificacion: "Transaccion",
      enlace,
    });
  }
  return { id, estado: "solicitada" };
};

exports.listar = async (user) => {
  let sql = `${SELECT} WHERE 1=1`;
  const values = [];
  if (user.rol === "cliente") {
    values.push(Number(user.id));
    sql += ` AND c.cliente_id = $${values.length}`;
  } else if (user.rol === "corredor") {
    values.push(Number(user.id));
    sql += ` AND (c.cliente_id = $${values.length} OR co.usuario_id = $${values.length})`;
  }
  sql += " ORDER BY c.id DESC LIMIT 100";
  const { rows } = await pool.query(sql, values);
  return rows;
};

exports.aceptar = async (id, user) => {
  const cita = await cargar(id);
  if (!puedeGestionar(user, cita)) throw new AppError("No puedes aceptar esta cita", 403);
  if (cita.estado !== "solicitada") throw new AppError("Esta cita ya fue respondida", 400);
  await pool.query(`UPDATE citas_visita SET estado = 'aceptada' WHERE id = $1`, [cita.id]);
  await notificaciones.create({
    usuario_id: cita.cliente_id,
    titulo: "Cita aceptada",
    descripcion: `La administradora aceptó tu cita para ver ${cita.inmueble_titulo}. Elige el día y la hora.`,
    tipo_notificacion: "Transaccion",
    enlace: `/citas?cita=${cita.id}`,
  });
  return cargar(id);
};

exports.rechazar = async (id, user) => {
  const cita = await cargar(id);
  if (!puedeGestionar(user, cita)) throw new AppError("No puedes rechazar esta cita", 403);
  if (cita.estado === "confirmada") throw new AppError("La cita ya está confirmada", 400);
  await pool.query(`UPDATE citas_visita SET estado = 'rechazada' WHERE id = $1`, [cita.id]);
  await notificaciones.create({
    usuario_id: cita.cliente_id,
    titulo: "Cita no agendada",
    descripcion: `La administradora no agendó la cita para ver ${cita.inmueble_titulo}.`,
    tipo_notificacion: "Transaccion",
    enlace: `/citas?cita=${cita.id}`,
  });
  return cargar(id);
};

exports.programar = async (id, user, body) => {
  const cita = await cargar(id);
  if (Number(user.id) !== Number(cita.cliente_id) && user.rol !== "admin") {
    throw new AppError("Solo quien pidió la cita puede elegir el horario", 403);
  }
  if (!["aceptada", "programada"].includes(cita.estado)) {
    throw new AppError("La administradora todavía no acepta esta cita", 400);
  }
  const fecha = String(body.fecha || "");
  const hora = String(body.hora || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
    throw new AppError("Indica el día y la hora", 400);
  }
  await pool.query(
    `UPDATE citas_visita SET estado = 'programada', fecha = $2::date, hora = $3 WHERE id = $1`,
    [cita.id, fecha, hora]
  );
  await notificaciones.createToAllAdmins({
    titulo: "Horario de cita",
    descripcion: `${cita.cliente_nombre} propone ver ${cita.inmueble_titulo} el ${fecha} a las ${hora}. Falta tu confirmación.`,
    tipo_notificacion: "Transaccion",
    enlace: `/citas?cita=${cita.id}`,
  });
  return cargar(id);
};

exports.confirmar = async (id, user) => {
  const cita = await cargar(id);
  if (!puedeGestionar(user, cita)) throw new AppError("No puedes confirmar esta cita", 403);
  if (cita.estado !== "programada" || !cita.fecha || !cita.hora) {
    throw new AppError("El cliente todavía no elige día y hora", 400);
  }
  await pool.query(`UPDATE citas_visita SET estado = 'confirmada' WHERE id = $1`, [cita.id]);
  const hora = String(cita.hora).slice(0, 5);
  const fecha = String(cita.fecha).slice(0, 10);
  await notificaciones.create({
    usuario_id: cita.cliente_id,
    titulo: "Cita confirmada",
    descripcion: `La administradora confirmó tu cita para ver ${cita.inmueble_titulo} el ${fecha} a las ${hora}.`,
    tipo_notificacion: "Transaccion",
    enlace: `/citas?cita=${cita.id}`,
  });
  return cargar(id);
};

exports.pagoMovil = async () => {
  const { rows } = await pool.query(
    `SELECT pago_movil_banco, pago_movil_telefono, pago_movil_cedula, pago_movil_titular
       FROM parametros_portal ORDER BY id LIMIT 1`
  );
  const row = rows[0] || {};
  return {
    banco: row.pago_movil_banco || "",
    telefono: row.pago_movil_telefono || "",
    cedula: row.pago_movil_cedula || "",
    titular: row.pago_movil_titular || "",
  };
};

exports.guardarPagoMovil = async (body) => {
  const banco = String(body.banco || "").trim().slice(0, 80);
  const telefono = String(body.telefono || "").trim().slice(0, 20);
  const cedula = String(body.cedula || "").trim().slice(0, 20);
  const titular = String(body.titular || "").trim().slice(0, 80);
  if (!banco || !telefono || !cedula) {
    throw new AppError("Banco, teléfono y cédula son obligatorios", 400);
  }
  await pool.query(
    `UPDATE parametros_portal
        SET pago_movil_banco = $1, pago_movil_telefono = $2, pago_movil_cedula = $3, pago_movil_titular = $4`,
    [banco, telefono, cedula, titular]
  );
  return exports.pagoMovil();
};
