CREATE OR REPLACE FUNCTION fn_calcular_promedio_estrellas()
RETURNS TRIGGER AS $$
DECLARE
    v_promedio numeric(3,2);
    v_cantidad_resenas INTEGER;
BEGIN

    SELECT COALESCE(AVG(estrellas), 0), COUNT(*) INTO v_promedio, v_cantidad_resenas
    FROM resenas
    WHERE inmueble_id = COALESCE(NEW.inmueble_id, OLD.inmueble_id);

    -- Si alguien quiere hacer que el promedio de las estrellas se calcule de otra manera, 
    -- deberia de agarrar el promedio del inmueble y hacer los calculos correspondientes
    -- Esta es la consulta con los datos desglosados:
    /*
    SELECT i.promedio_estrellas, COUNT(r.id) as cantidad_resenas
    INTO v_promedio, v_cantidad_resenas
    FROM inmuebles AS i
    LEFT JOIN
    resenas AS r
    ON
    i.id = r.inmueble_id
    WHERE i.id = COALESCE(NEW.inmueble_id, OLD.inmueble_id);
    */

    UPDATE inmuebles
    SET promedio_estrellas = v_promedio
    
    WHERE id = COALESCE(NEW.inmueble_id, OLD.inmueble_id);

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_resena_inmueble_cambio
AFTER INSERT OR UPDATE OR DELETE ON resenas
FOR EACH ROW
EXECUTE FUNCTION fn_calcular_promedio_estrellas();