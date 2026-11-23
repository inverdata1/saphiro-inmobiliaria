-- 011_add_comision.sql dropeó corredores.comision_base y reemplazó SOLO la función
-- del trigger AFTER UPDATE (fn_comisiones_agregar_comision). La función del trigger
-- AFTER INSERT (fn_actualizar_inmueble_transaccion) quedó referenciando la columna
-- eliminada, por lo que cualquier INSERT en transacciones con estatus_pago = 'pagado'
-- fallaba con: no existe la columna «comision_base».
-- Se reemplaza con la misma lógica por tipo de inmueble.

CREATE OR REPLACE FUNCTION fn_actualizar_inmueble_transaccion()
RETURNS TRIGGER AS $$
DECLARE
    v_inmueble_id integer;
    v_monto_comision numeric(15,2);
    v_porcentaje_aplicado numeric(5,2);
    v_empresa_ganancia numeric(15,2);
    v_corredor_id integer;
    v_estado_inmueble varchar(50);
BEGIN
    SELECT inmueble_id
    INTO v_inmueble_id
    FROM transacciones
    WHERE id = NEW.id;

    IF NEW.estatus_pago = 'pagado' THEN
        --Se obtiene el corredor y el tipo de inmueble
        SELECT
            corredor_id,
            estado_inmueble
        INTO
            v_corredor_id,
            v_estado_inmueble
        FROM
            inmuebles
        WHERE
            id = v_inmueble_id;

        IF v_corredor_id IS NULL THEN
            RAISE EXCEPTION 'No existe un corredor asignado al inmueble';
        END IF;

        --Se obtiene el porcentaje de comision del corredor segun el tipo de inmueble
        SELECT
            CASE v_estado_inmueble
                WHEN 'alquiler_fijo' THEN comision_alquiler_fijo
                WHEN 'vacacional' THEN comision_vacacional
                ELSE comision_venta
            END
        INTO
            v_porcentaje_aplicado
        FROM
            corredores
        WHERE
            id = v_corredor_id;

        IF v_porcentaje_aplicado IS NULL THEN
            RAISE EXCEPTION 'El corredor no tiene una comision asignada para el tipo de inmueble %', v_estado_inmueble;
        END IF;

        v_monto_comision = NEW.monto_total * (v_porcentaje_aplicado / 100);
        v_empresa_ganancia = v_monto_comision * (1 - 0.16);

        INSERT INTO comisiones (
            transaccion_id,
            corredor_id,
            monto_comision,
            porcentaje_aplicado,
            empresa_ganancia,
            fecha_pago
        ) VALUES (
            NEW.id,
            v_corredor_id,
            v_monto_comision,
            v_porcentaje_aplicado,
            v_empresa_ganancia,
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
