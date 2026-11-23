CREATE OR REPLACE FUNCTION fn_comisiones_agregar_comision()
RETURNS TRIGGER AS $$
DECLARE
    v_monto_comision numeric(15,2);
    v_porcentaje_aplicado numeric(5,2);
    v_empresa_ganancia numeric(15,2);
    v_corredor_id integer;
BEGIN

    IF NEW.estatus_pago = OLD.estatus_pago THEN
        RETURN NEW;
    END IF;

    IF NEW.estatus_pago = 'pagado' THEN
        --limpiar comisiones por si acaso
        IF EXISTS(
            SELECT 1 FROM comisiones
            WHERE transaccion_id = NEW.id
        ) THEN
            DELETE FROM
                comisiones
            WHERE
                transaccion_id = NEW.id;
        END IF;

        --Se obtiene el id del corredor
        SELECT
            corredor_id
        INTO
            v_corredor_id
        FROM
            inmuebles
        WHERE
            id= NEW.inmueble_id;

        IF v_corredor_id IS NULL THEN
            RAISE EXCEPTION 'No existe un corredor asignado al inmueble';
        END IF;

        --Se obtiene el porcentaje de comision del corredor
        SELECT
            comision_base
        INTO
            v_porcentaje_aplicado
        FROM
            corredores
        WHERE
            id = v_corredor_id;

        IF v_porcentaje_aplicado IS NULL THEN
            RAISE EXCEPTION 'El corredor no tiene una comision base asignada';
        END IF;

        --Se calcula el monto de la comision
        v_monto_comision = NEW.monto_total * (v_porcentaje_aplicado / 100);

        --Se calcula la ganancia de la empresa
        v_empresa_ganancia = v_monto_comision * (1 - 0.16);

        --Se inserta la comision
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

        RETURN NEW;
    ELSE
        -- Si la transaccion es cancelada, se eliminan las comisiones
        DELETE FROM comisiones
        WHERE transaccion_id = NEW.id;
        
        RETURN NEW;
    END IF;


    RETURN NULL;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_transacciones_comision_aft_up
AFTER UPDATE ON transacciones
FOR EACH ROW
EXECUTE FUNCTION fn_comisiones_agregar_comision();