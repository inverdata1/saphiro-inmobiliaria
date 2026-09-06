const pool = require("../db/pool");
const AppError = require("../utils/AppError");
const auditoriaService = require("./auditoria.service");

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


exports.saveInmueble = async ({ usuario_id, inmueble_id }, ctx) => {
    const client = await pool.connect();
    let guardado;

    try {
        await client.query("BEGIN");

        //validar que el inmueble exista
        const inmueble = await client.query(
            "SELECT * FROM inmuebles WHERE id = $1",
            [inmueble_id]
        );

        if (inmueble.rows.length === 0) {
            throw new AppError("Inmueble no encontrado", 404);
        }

        //validar que el usuario exista
        const usuario = await client.query(
            "SELECT * FROM usuarios WHERE id = $1",
            [usuario_id]
        );

        if (usuario.rows.length === 0) {
            throw new AppError("Usuario no encontrado", 404);
        }

        //validar que el inmueble no este guardado por el usuario
        const yaGuardado = await client.query(
            "SELECT * FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2",
            [usuario_id, inmueble_id]
        );

        if (yaGuardado.rows.length > 0) {
            throw new AppError("Inmueble ya guardado por el usuario", 400);
        }

        //guardar el inmueble
        const result = await client.query(
            "INSERT INTO guardados (usuario_id,inmueble_id) VALUES($1, $2) RETURNING *",
            [usuario_id, inmueble_id]
        );

        guardado = result.rows[0];

        if (ctx) {
          await auditoriaService.registrarInsert({
            usuario_id: ctx.usuario_id,
            tabla_afectada: "guardados",
            descripcion: `Guardado inmueble ${inmueble_id} por usuario ${usuario_id}`,
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

    return guardado;
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

    //listar los inmuebles guardados del usuario
    const guardado = await pool.query(
        `SELECT
              i.*,
              INITCAP(REPLACE(i.estado_inmueble, '_', ' ')) AS estado_inmueble,
              c.nombre AS ciudad,
              e.nombre AS estado,
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
              ${VACACIONAL_SELECT}
            FROM guardados g
            LEFT JOIN inmuebles i
            ON g.inmueble_id = i.id
            LEFT JOIN ciudades c ON c.id = i.ciudad_id
            LEFT JOIN estados e ON e.id = c.estado_id
            WHERE g.usuario_id = $1`,
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
    const client = await pool.connect();
    let eliminado;

    try {
        await client.query("BEGIN");

        //validar que el inmueble exista
        const inmueble = await client.query(
            "SELECT * FROM inmuebles WHERE id = $1",
            [inmueble_id]
        );

        if (inmueble.rows.length === 0) {
            throw new AppError("Inmueble no encontrado", 404);
        }

        //validar que el usuario exista
        const usuario = await client.query(
            "SELECT * FROM usuarios WHERE id = $1",
            [usuario_id]
        );

        if (usuario.rows.length === 0) {
            throw new AppError("Usuario no encontrado", 404);
        }

        //validar que el inmueble no este guardado por el usuario
        const guardado = await client.query(
            "SELECT * FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2",
            [usuario_id, inmueble_id]
        );

        if (guardado.rows.length === 0) {
            await client.query("COMMIT");
            return [];
        }

        //eliminar el guardado
        const result = await client.query(
            "DELETE FROM guardados WHERE usuario_id = $1 AND inmueble_id = $2 RETURNING *",
            [usuario_id, inmueble_id]
        );

        eliminado = result.rows[0];

        if (ctx) {
          await auditoriaService.registrarDelete({
            usuario_id: ctx.usuario_id,
            tabla_afectada: "guardados",
            descripcion: `Eliminado guardado inmueble ${inmueble_id} por usuario ${usuario_id}`,
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

    return eliminado;
};