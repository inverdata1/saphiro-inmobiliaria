const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const { sendEmail } = require("./email.service");
const redis = require("./redis.service");
const auditoriaService = require("./auditoria.service");

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:5173";

async function borrarTokensRegistro(prefijo, usuarioId) {
  const keys = await redis.keys(`registro:${prefijo}:*`);
  for (const key of keys) {
    const val = await redis.get(key);
    if (val === String(usuarioId)) {
      await redis.del(key);
    }
  }
}

const searchUserByEmail = async (email) => {
  const existing = await pool.query(
    "SELECT id FROM usuarios WHERE email = $1 AND deleted_at IS NULL LIMIT 1;",
    [email]
  );

  if (existing.rows.length) throw new AppError("Usuario ya existe", 409);
  return existing.rows[0];
}

//Registro para usuarios normales
exports.register = async ({ nombre, email, password }, ctx) => {

  //Validaciones
  if (!nombre) throw new AppError("nombre es requerido", 400);
  if (!email) throw new AppError("email es requerido", 400);
  if (!password) throw new AppError("password es requerido", 400);

  //Verifica si existe un usuario con el mismo correo electronico
  await searchUserByEmail(email);

  //Hashea la contraseña
  const password_hash = await bcrypt.hash(String(password), 10);

  //Se establece al usuario como un cliente
  const rolDb = "cliente";

  //Inserta el usuario
  const client = await pool.connect();
  let user;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, fecha_registro, email_verified)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, false)
        RETURNING id, nombre, email, rol, fecha_registro, email_verified;`,
      [nombre, email, password_hash, rolDb]
    );

    user = rows[0];

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id || user.id,
        tabla_afectada: "usuarios",
        descripcion: `Registro de usuario "${nombre}" (${email})`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  //Genera token de verificación de correo
  const verifyToken = crypto.randomUUID();
  await redis.setex(`email-verify:${verifyToken}`, 86400, String(user.id));

  //Envía correo de verificación
  await sendEmail({
    to: email,
    subject: "Verifica tu correo electrónico",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Verifica tu correo electrónico</h2>
        <p>Hola <strong>${nombre}</strong>, gracias por registrarte en <strong>Inverdata C.A</strong>.</p>
        <p>Para completar tu registro, haz clic en el siguiente botón:</p>
        <a href="${CLIENT_BASE_URL}/verificar-email?token=${verifyToken}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Verificar correo
        </a>
        <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>
      </div>
    `,
  });

  //Se retornan los datos del usuario
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    fecha_registro: user.fecha_registro,
    email_verified: user.email_verified,
  };
};

//Verificar correo electrónico
exports.verificarEmail = async ({ token }) => {
  if (!token) throw new AppError("El token es requerido", 400);

  //Busca el token en Redis
  const userId = await redis.get(`email-verify:${token}`);
  if (!userId) throw new AppError("Enlace inválido o expirado", 404);

  //Obtiene datos del usuario
  const { rows } = await pool.query(
    `UPDATE usuarios SET email_verified = true WHERE id = $1 RETURNING id, nombre, email, rol;`,
    [userId]
  );

  if (!rows.length) throw new AppError("Usuario no encontrado", 404);

  const user = rows[0];

  //Elimina el token de Redis
  await redis.del(`email-verify:${token}`);

  //Genera tokens de sesión
  const tokens = await exports.issueTokenPair({ id: user.id, rol: user.rol });

  return {
    message: "Correo verificado exitosamente",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      email_verified: true,
    },
  };
};

//Reenviar correo de verificación
exports.reenviarVerificacion = async ({ email }) => {
  if (!email) throw new AppError("El email es requerido", 400);

  //Busca el usuario
  const { rows } = await pool.query(
    "SELECT id, nombre, email, email_verified FROM usuarios WHERE email = $1 LIMIT 1;",
    [email]
  );

  if (!rows.length) throw new AppError("Usuario no encontrado", 404);
  if (rows[0].email_verified) throw new AppError("El correo ya está verificado", 400);

  const user = rows[0];

  //Elimina tokens anteriores
  const keys = await redis.keys("email-verify:*");
  for (const key of keys) {
    const val = await redis.get(key);
    if (val === String(user.id)) {
      await redis.del(key);
    }
  }

  //Genera nuevo token
  const verifyToken = crypto.randomUUID();
  await redis.setex(`email-verify:${verifyToken}`, 86400, String(user.id));

  //Envía correo de verificación
  await sendEmail({
    to: email,
    subject: "Verifica tu correo electrónico",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Verifica tu correo electrónico</h2>
        <p>Hola <strong>${user.nombre}</strong>, has solicitado reenviar el correo de verificación.</p>
        <p>Para completar tu registro, haz clic en el siguiente botón:</p>
        <a href="${CLIENT_BASE_URL}/verificar-email?token=${verifyToken}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Verificar correo
        </a>
        <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>
      </div>
    `,
  });

  return { message: "Correo de verificación reenviado" };
};

//Registro de corredores
//Un admin le envia un enlace por el correo electronico al usuario para que se registre como corredor
//el usuario queda registrado en la base de datos, pero sin contraseña y datos faltantes que el usuario llenara al
//atender el correo
exports.registerCorredor = async ({ email, porcentaje }, ctx) => {

  //Validaciones
  if(!email || !porcentaje) throw new AppError("El email y el porcentaje del corredor son requeridos", 400);

  //Verifica si existe un usuario con el mismo correo electronico
  await searchUserByEmail(email);

  const client = await pool.connect();
  let id_corredor;

  try {
    await client.query("BEGIN");

    //Inserta el usuario
    const InsertUserQ = await client.query(`
      INSERT INTO usuarios (email, rol, fecha_registro) VALUES ($1, 'corredor', CURRENT_TIMESTAMP) RETURNING id;
    `, [email]);

    id_corredor = InsertUserQ.rows[0].id;

    //Inserta el corredor
    await client.query(`
      INSERT INTO corredores (usuario_id, comision_base) VALUES ($1, $2)
    `, [id_corredor, porcentaje]);

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "corredores",
        descripcion: `Invitación de corredor (${email})`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  //Se genera un token para el registro
  const token = crypto.randomUUID();

  //El token se almacena en redis
  //El token expera en 24 horas y al 
  await redis.setex(`registro:corredor:${token}`, 86400, String(id_corredor));

  //Se envia el correo electronico al usuario
  await sendEmail({
    to: email,
    subject: "Has sido registrado como corredor",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Registro de corredor</h2>
        <p>Has sido registrado en el sistema <strong>Inverdata C.A</strong> como corredor.</p>
        <p>Para completar tu registro y acceder al panel, haz clic en el siguiente botón:</p>
        <!-- Boton con el enlace con el token para que el usuario complete su registro -->
        <a href="${CLIENT_BASE_URL}/corredores/registro?token=${token}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Completar registro
        </a>
        <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no esperabas este correo, ignóralo.</p>
      </div>
    `,
  });

}

//Reinvitar corredor (reenviar código de registro)
exports.reinvitarCorredor = async ({ id }) => {
  if (!id) throw new AppError("El id es requerido", 400);

  const { rows } = await pool.query(
    "SELECT u.id, u.email, u.nombre FROM usuarios u WHERE u.id = $1 AND u.rol = 'corredor' LIMIT 1;",
    [id]
  );
  if (!rows.length) throw new AppError("Corredor no encontrado", 404);

  if (rows[0].nombre) throw new AppError("Este corredor ya completó su registro", 400);

  await borrarTokensRegistro("corredor", id);

  const token = crypto.randomUUID();
  await redis.setex(`registro:corredor:${token}`, 86400, String(id));

  await sendEmail({
    to: rows[0].email,
    subject: "Has sido registrado como corredor",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Registro de corredor</h2>
        <p>Has sido registrado en el sistema <strong>Inverdata C.A</strong> como corredor.</p>
        <p>Para completar tu registro y acceder al panel, haz clic en el siguiente botón:</p>
        <a href="${CLIENT_BASE_URL}/corredores/registro?token=${token}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Completar registro
        </a>
        <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no esperabas este correo, ignóralo.</p>
      </div>
    `,
  });

  return { message: "Invitación reenviada exitosamente" };
};

//Login
exports.login = async ({ email, password }) => {
  //Validaciones
  if (!email || !password) throw new AppError("email y password son requeridos", 400);

  //Se busca al usuario en la base de datos por medio del email
  const { rows } = await pool.query(
    "SELECT id, nombre, email, password_hash, rol, active, email_verified FROM usuarios WHERE email = $1 LIMIT 1;",
    [email]
  );

  //Si no se encuentra al usuario o se encuantra baneado (inhabilitado) se aborta el proceso
  if (!rows.length) throw new AppError("Credenciales inválidas", 401);
  if (!rows[0].active) throw new AppError("Usuario inhabilitado", 401);

  const user = rows[0];

  //Se compara la contraseña enviada con la contraseña hasheada
  const match = await bcrypt.compare(String(password), String(user.password_hash));
  if (!match) throw new AppError("Credenciales inválidas", 401);

  //Si el correo no está verificado se bloquea el login
  if (!user.email_verified) {
    const err = new AppError("Debes verificar tu correo electrónico antes de iniciar sesión.", 403);
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  //Se generan los tokens (access + refresh)
  const tokens = await exports.issueTokenPair({ id: user.id, rol: user.rol });

  //Se retornan los tokens y los datos del usuario
  return {
    ...tokens,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      email_verified: user.email_verified,
    },
  };
};

//Genera un par de tokens (access + refresh) y almacena el refresh en Redis
exports.issueTokenPair = async ({ id, rol }) => {
  const jwtSecret = process.env.JWT_SECRET || "inmob-secret";

  const accessToken = jwt.sign({ id, rol }, jwtSecret, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id, rol }, jwtSecret, { expiresIn: "7d" });

  //Almacena el refresh token en Redis (7 días)
  await redis.setex(`refresh:${refreshToken}`, 7 * 24 * 60 * 60, String(id));

  return { accessToken, refreshToken };
};

//Rota el refresh token: valida el viejo, genera nuevos tokens, elimina el viejo
exports.rotateRefreshToken = async (oldRefreshToken) => {
  const jwtSecret = process.env.JWT_SECRET || "inmob-secret";

  //Verifica que el refresh token sea válido
  let payload;
  try {
    payload = jwt.verify(oldRefreshToken, jwtSecret);
  } catch {
    throw new AppError("Refresh token inválido o expirado", 401);
  }

  //Verifica que exista en Redis (no haya sido revocado)
  const storedUserId = await redis.get(`refresh:${oldRefreshToken}`);
  if (!storedUserId) throw new AppError("Refresh token revocado", 401);

  //Elimina el refresh token viejo de Redis (rotación = single-use)
  await redis.del(`refresh:${oldRefreshToken}`);

  //Genera nuevos tokens
  const tokens = await exports.issueTokenPair({ id: payload.id, rol: payload.rol });

  //Obtiene email_verified del usuario
  const { rows } = await pool.query(
    "SELECT email_verified FROM usuarios WHERE id = $1 LIMIT 1;",
    [payload.id]
  );

  return {
    ...tokens,
    user: { id: payload.id, rol: payload.rol, email_verified: rows[0]?.email_verified },
  };
};

//Revoca un refresh token específico
exports.revokeRefreshToken = async (refreshToken) => {
  if (refreshToken) await redis.del(`refresh:${refreshToken}`);
};

//Revoca todos los refresh tokens de un usuario (logout global / cambio de contraseña)
exports.revokeAllRefreshTokens = async (userId) => {
  const keys = await redis.keys("refresh:*");
  for (const key of keys) {
    const val = await redis.get(key);
    if (val === String(userId)) {
      await redis.del(key);
    }
  }
};

//Obtiene los datos del usuario
exports.me = async (userId) => {
  //Si no se proporciona un id de usuario se aborta el proceso
  if (!userId) throw new AppError("No autorizado", 401);

  //Se busca al usuario en la base de datos por medio del id
  const { rows } = await pool.query(
    "SELECT id, nombre, email, rol, fecha_registro, email_verified FROM usuarios WHERE id = $1 LIMIT 1;",
    [userId]
  );

  //Si no se encuentra el usuario entonces significa que no existe
  if (!rows.length) throw new AppError("Usuario no existe", 404);

  //Se retorna el usuario
  const user = rows[0];
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    fecha_registro: user.fecha_registro,
    email_verified: user.email_verified,
  };
};

//Valida el token de registro
//El usuario al entrar al enlace del correo electronico, el token del enlace es verificado para saber si el link es valido o no
//En caso de no serlo, el front envia al usuario a otra pagina
exports.validarTokenRegistro = async (token, rol) => {
  //Se busca el token en redis segun el rol
  let usuarioId;
  if (rol === "corredor") {
    usuarioId = await redis.get(`registro:corredor:${token}`);
  } else if (rol === "admin") {
    usuarioId = await redis.get(`registro:admin:${token}`);
  }
  
  //Si no se encuentra el token entonces significa que es invalido o expirado
  if (!usuarioId) throw new AppError("Enlace inválido o expirado", 404);

  //Se busca al usuario en la base de datos por medio del id
  const { rows } = await pool.query(
    "SELECT id, email FROM usuarios WHERE id = $1 LIMIT 1;",
    [usuarioId]
  );

  //Si no se encuentra el usuario entonces significa que no existe
  if (!rows.length) throw new AppError("Usuario no encontrado", 404);

  //Se retorna el usuario
  return { id: rows[0].id, email: rows[0].email };
};

//Completa el registro del usuario
//Mediante el token que se le provee al usuario por el enlace del correo electronico, se identifica al usuario
//Y se procede a guardar los datos faltantes del corredor
exports.completarRegistro = async ({ token, nombre, telefono, licencia_nro, password }, ctx) => {
  //Validaciones
  if (!token) {
    throw new AppError("El token es requerido", 400);
  }

  if(!nombre){
    throw new AppError("El nombre es requerido", 400);
  };
  
  if(!password){
    throw new AppError("La contraseña es requerida", 400);
  };
  
  if(!licencia_nro){
    throw new AppError("El número de licencia es requerido", 400);
  };
  
  if(!telefono){
    throw new AppError("El teléfono es requerido", 400);
  };

  //Se obtiene el Id del usuario mediante el
  let usuarioId = await redis.get(`registro:corredor:${token}`);
  if (!usuarioId) usuarioId = await redis.get(`registro:${token}`);
  if (!usuarioId) throw new AppError("Enlace inválido o expirado", 404);

  //Se hashea su contraseña
  const password_hash = await bcrypt.hash(String(password), 10);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    //Se llenan los datos faltantes del usuario
    await client.query(
      `UPDATE usuarios SET nombre = $1, password_hash = $2 WHERE id = $3;`,
      [nombre, password_hash, usuarioId]
    );

    await client.query(
      `UPDATE corredores SET telefono = $1, licencia_nro = $2 WHERE usuario_id = $3;`,
      [telefono || null, licencia_nro || null, usuarioId]
    );

    await client.query(
      `UPDATE usuarios SET email_verified = true WHERE id = $1;`,
      [usuarioId]
    );

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id || Number(usuarioId),
        tabla_afectada: "usuarios",
        descripcion: `Completado registro de corredor ${usuarioId}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  //Se elimina el token de redis
  await redis.del(`registro:corredor:${token}`);

  //Se retorna un mensaje de exito
  return { message: "Registro completado exitosamente" };
};

//Invitar administrador
exports.invitarAdmin = async ({ email }, ctx) => {
  if (!email) throw new AppError("El email es requerido", 400);

  const existing = await searchUserByEmail(email);

  const client = await pool.connect();
  let id_admin;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(`
      INSERT INTO usuarios (email, rol, fecha_registro) VALUES ($1, 'admin', CURRENT_TIMESTAMP) RETURNING id;
    `, [email]);

    id_admin = rows[0].id;

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "usuarios",
        descripcion: `Invitación de admin (${email})`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const token = crypto.randomUUID();
  await redis.setex(`registro:admin:${token}`, 86400, String(id_admin));

  await sendEmail({
    to: email,
    subject: "Has sido registrado como administrador",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Registro de administrador</h2>
        <p>Has sido registrado en el sistema <strong>Inverdata C.A</strong> como administrador.</p>
        <p>Para completar tu registro y acceder al panel, haz clic en el siguiente botón:</p>
        <a href="${CLIENT_BASE_URL}/administradores/registro?token=${token}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Completar registro
        </a>
        <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no esperabas este correo, ignóralo.</p>
      </div>
    `,
  });
};

//Reinvitar administrador (reenviar código de registro)
exports.reinvitarAdmin = async ({ id }) => {
  if (!id) throw new AppError("El id es requerido", 400);

  const { rows } = await pool.query(
    "SELECT id, email, nombre FROM usuarios WHERE id = $1 AND rol = 'admin' LIMIT 1;",
    [id]
  );
  if (!rows.length) throw new AppError("Administrador no encontrado", 404);

  if (rows[0].nombre) throw new AppError("Este administrador ya completó su registro", 400);

  await borrarTokensRegistro("admin", id);

  const token = crypto.randomUUID();
  await redis.setex(`registro:admin:${token}`, 86400, String(id));

  await sendEmail({
    to: rows[0].email,
    subject: "Has sido registrado como administrador",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Registro de administrador</h2>
        <p>Has sido registrado en el sistema <strong>Inverdata C.A</strong> como administrador.</p>
        <p>Para completar tu registro y acceder al panel, haz clic en el siguiente botón:</p>
        <a href="${CLIENT_BASE_URL}/administradores/registro?token=${token}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Completar registro
        </a>
        <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no esperabas este correo, ignóralo.</p>
      </div>
    `,
  });

  return { message: "Invitación reenviada exitosamente" };
};

//Completa el registro del administrador
exports.completarRegistroAdmin = async ({ token, nombre, password }, ctx) => {
  if (!token) throw new AppError("El token es requerido", 400);
  if (!nombre) throw new AppError("El nombre es requerido", 400);
  if (!password) throw new AppError("La contraseña es requerida", 400);

  const usuarioId = await redis.get(`registro:admin:${token}`);
  if (!usuarioId) throw new AppError("Enlace inválido o expirado", 404);

  const password_hash = await bcrypt.hash(String(password), 10);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE usuarios SET nombre = $1, password_hash = $2 WHERE id = $3;`,
      [nombre, password_hash, usuarioId]
    );

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id || Number(usuarioId),
        tabla_afectada: "usuarios",
        descripcion: `Completado registro de admin ${usuarioId}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  await redis.del(`registro:admin:${token}`);

  return { message: "Registro completado exitosamente" };
};

//Solicitar restablecimiento de contraseña
//Se genera un codigo de 6 digitos, se almacena en redis por 5 minutos y se envia por correo electronico
exports.solicitarReset = async ({ email }) => {
  if (!email) throw new AppError("El email es requerido", 400);

  const { rows } = await pool.query(
    "SELECT id FROM usuarios WHERE email = $1 LIMIT 1;",
    [email]
  );

  if (!rows.length) throw new AppError("Usuario no encontrado", 404);

  //Se genera un codigo de 6 digitos
  const code = String(Math.floor(100000 + Math.random() * 900000));

  //Se almacena en redis por 5 minutos (300 segundos)
  await redis.setex(`password-reset:${email}`, 300, code);

  //Se envia el correo electronico con el codigo
  await sendEmail({
    to: email,
    subject: "Código de restablecimiento de contraseña",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#2563eb;">Restablecer contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en <strong>Inverdata C.A</strong>.</p>
        <p>Tu código de verificación es:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e293b;background:#f1f5f9;padding:16px 32px;border-radius:8px;">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">Este código expira en 5 minutos. Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `,
  });

  return { message: "Código de verificación enviado" };
};

//Verificar el codigo de restablecimiento de contraseña
//Se verifica que el codigo coincida con el almacenado en redis y se devuelve un token de autorizacion
exports.verificarCodigoReset = async ({ email, code }) => {
  if (!email) throw new AppError("El email es requerido", 400);
  if (!code) throw new AppError("El código es requerido", 400);
  if (code.length != 6) throw new AppError("El código debe tener 6 dígitos", 400);

  //Se obtiene el codigo almacenado en redis
  const storedCode = await redis.get(`password-reset:${email}`);

  if (!storedCode) throw new AppError("Código inválido o expirado", 400);
  if (storedCode !== String(code)) throw new AppError("Código incorrecto", 400);

  //Se genera un token de autorizacion para cambiar la contraseña
  const resetToken = crypto.randomUUID();
  await redis.setex(`password-reset-token:${email}`, 300, resetToken);

  //Se elimina el codigo de verificacion
  await redis.del(`password-reset:${email}`);

  return { authorized: true, resetToken };
};

//Restablecer la contraseña
//Se verifica el token de autorizacion y se cambia la contraseña
exports.resetPassword = async ({ email, resetToken, newPassword }, ctx) => {
  if (!email) throw new AppError("El email es requerido", 400);
  if (!resetToken) throw new AppError("El token de autorización es requerido", 400);
  if (!newPassword) throw new AppError("La nueva contraseña es requerida", 400);

  //Se verifica el token de autorizacion
  const storedToken = await redis.get(`password-reset-token:${email}`);

  if (!storedToken) throw new AppError("Token inválido o expirado", 400);
  if (storedToken !== resetToken) throw new AppError("Token inválido", 400);

  //Se hashea la nueva contraseña
  const password_hash = await bcrypt.hash(String(newPassword), 10);

  const client = await pool.connect();
  let userId;

  try {
    await client.query("BEGIN");

    //Se busca al usuario
    const { rows: userRows } = await client.query(
      "SELECT id FROM usuarios WHERE email = $1 LIMIT 1;",
      [email]
    );

    if (!userRows.length) throw new AppError("Usuario no encontrado", 404);

    userId = userRows[0].id;

    //Se actualiza la contraseña
    await client.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id = $2;",
      [password_hash, userRows[0].id]
    );

    if (ctx) {
      await auditoriaService.registrarUpdate({
        usuario_id: ctx.usuario_id || userId,
        tabla_afectada: "usuarios",
        descripcion: `Restablecimiento de contraseña para ${email}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  //Se elimina el token de autorizacion
  await redis.del(`password-reset-token:${email}`);

  return { message: "Contraseña restablecida exitosamente" };
};