const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");


exports.saveInmueble = async ({ usuario_id, inmueble_id }, ctx) => {

    //validar que el inmueble exista
    const inmueble = await pool.query(
        "SELECT * FROM inmuebles WHERE id = $1",
        [inmueble_id]
    );

    if (inmueble.rows.length === 0) {
        throw new AppError("Inmueble no encontrado", 404);
    }

    //validar que el usuario exista
    const usuario = await pool.query(
        "SELECT * FROM usuarios WHERE id = $1",
        [usuario_id]
    );

    if (usuario.rows.length === 0) {
        throw new AppError("Usuario no encontrado", 404);
    }

    //validar que el inmueble no este guardado por el usuario
    const guardado = await pool.query(
        "SELECT * FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2",
        [usuario_id, inmueble_id]
    );

    if (guardado.rows.length > 0) {
        throw new AppError("Inmueble ya guardado por el usuario", 400);
    }

    //guardar el inmueble
    const result = await pool.query(
        "INSERT INTO guardados (usuario_id,inmueble_id) VALUES($1, $2) RETURNING *",
        [usuario_id, inmueble_id]
    );

    if (ctx) {
      await auditoriaService.registrarInsert({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "guardados",
        descripcion: `Guardado inmueble ${inmueble_id} por usuario ${usuario_id}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      });
    }

    return result.rows[0];
};

exports.listGuardados= async ()=>{

    const result = await pool.query(
        "SELECT * FROM guardados"
    );

    return result.rows;
};

exports.listGuardadosByUsuario = async (usuario_id) =>{

    //validar que el usuario exista
    const usuario = await pool.query(
        "SELECT * FROM usuarios WHERE id = $1",
        [usuario_id]
    );

    if (usuario.rows.length === 0) {
        throw new AppError("Usuario no encontrado", 404);
    }

    //validar que el inmueble no este guardado por el usuario
    const guardado = await pool.query(
        `SELECT i.*,
          (SELECT img.url FROM imagenes img WHERE img.inmueble_id = i.id ORDER BY img.orden ASC LIMIT 1) AS imagen_url
        FROM guardados g
        LEFT JOIN inmuebles i
        ON g.inmueble_id = i.id
        WHERE usuario_id = $1`,
        [usuario_id]
    );

    if (guardado.rows.length === 0) {
        throw new AppError("Inmueble no encontrado", 404);
    }

    return guardado.rows;
};

exports.getGuardado= async(usuario_id, inmueble_id) => {

    //validar que el inmueble exista
    const inmueble = await pool.query(
        "SELECT * FROM inmuebles WHERE id = $1",
        [inmueble_id]
    );

    if (inmueble.rows.length === 0) {
        throw new AppError("Inmueble no encontrado", 404);
    }

    //validar que el usuario exista
    const usuario = await pool.query(
        "SELECT * FROM usuarios WHERE id = $1",
        [usuario_id]
    );

    if (usuario.rows.length === 0) {
        throw new AppError("Usuario no encontrado", 404);
    }

    //validar que el inmueble no este guardado por el usuario
    const guardado = await pool.query(
        "SELECT * FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2",
        [usuario_id, inmueble_id]
    );

    if (guardado.rows.length === 0) {
        return false;
    }

    return true;
}

exports.deleteGuardado= async (usuario_id,inmueble_id, ctx) => {

    //validar que el inmueble exista
    const inmueble = await pool.query(
        "SELECT * FROM inmuebles WHERE id = $1",
        [inmueble_id]
    );

    if (inmueble.rows.length === 0) {
        throw new AppError("Inmueble no encontrado", 404);
    }

    //validar que el usuario exista
    const usuario = await pool.query(
        "SELECT * FROM usuarios WHERE id = $1",
        [usuario_id]
    );

    if (usuario.rows.length === 0) {
        throw new AppError("Usuario no encontrado", 404);
    }

    //validar que el inmueble no este guardado por el usuario
    const guardado = await pool.query(
        "SELECT * FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2",
        [usuario_id, inmueble_id]
    );

    if (guardado.rows.length === 0) {
        return [];
    }

    //guardar el inmueble
    const result = await pool.query(
        "DELETE FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2 RETURNING *",
        [usuario_id, inmueble_id]
    );

    if (ctx) {
      await auditoriaService.registrarDelete({
        usuario_id: ctx.usuario_id,
        tabla_afectada: "guardados",
        descripcion: `Eliminado guardado inmueble ${inmueble_id} por usuario ${usuario_id}`,
        ip_address: ctx.ip_address,
        user_agent: ctx.user_agent,
      });
    }

    return result.rows[0];
};