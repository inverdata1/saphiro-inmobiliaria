CREATE OR REPLACE FUNCTION Validacion_Transaccion_Estatus_Pago()
RETURNS TRIGGER AS $$
BEGIN

    IF NEW.estatus_pago = 'cancelado' THEN
        RAISE EXCEPTION 'La transaccion no puede ser creada estando cancelada';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER trg_transacciones_Inmueble_bfr_ins
BEFORE INSERT ON transacciones
FOR EACH ROW
EXECUTE FUNCTION Validacion_Transaccion_Estatus_Pago();