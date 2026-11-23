CREATE OR REPLACE PROCEDURE sp_registrar_auditoria_ins(
    p_usuario_id INTEGER,
    p_tabla_afectada VARCHAR(50),
    p_descripcion TEXT,
    p_ip_address VARCHAR(45),
    p_user_agent TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insertar el registro de auditoría en la tabla bitacora_auditoria
    INSERT INTO bitacora_auditoria (
        usuario_id,
        accion,
        tabla_afectada,
        descripcion,
        ip_address,
        user_agent,
        fecha_hora
    ) VALUES (
        p_usuario_id,
        'INSERT',
        p_tabla_afectada,
        p_descripcion,
        p_ip_address,
        p_user_agent,
        CURRENT_TIMESTAMP
    );
END;
$$;
