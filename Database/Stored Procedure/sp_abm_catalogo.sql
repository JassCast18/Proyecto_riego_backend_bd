DROP PROCEDURE IF EXISTS sp_abm_catalogo(VARCHAR, VARCHAR, INTEGER, JSONB);
DROP PROCEDURE IF EXISTS sp_abm_catalogo(VARCHAR, VARCHAR, INTEGER, JSONB, INTEGER);

CREATE OR REPLACE PROCEDURE sp_abm_catalogo(
    IN p_tabla VARCHAR,
    IN p_accion VARCHAR,
    IN p_id INTEGER,
    IN p_datos JSONB,
    IN p_proyecto_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_datos JSONB := COALESCE(p_datos, '{}'::JSONB) - 'id' - 'tb_proyecto_id';
    v_columnas TEXT; v_valores TEXT; v_asignaciones TEXT;
    v_sequence_name TEXT; v_max_id BIGINT; v_rows_affected BIGINT;
    v_pertenece BOOLEAN := FALSE;
BEGIN
    IF p_tabla NOT IN ('tb_finca','tb_sector','tb_cliente','tb_rol','tb_nodo_iot','tb_sensor_actuador') THEN
        RAISE EXCEPTION 'La tabla solicitada no está habilitada para ABM dinámico.';
    END IF;

    IF p_tabla = 'tb_finca' THEN
        v_pertenece := p_id IS NULL OR EXISTS (SELECT 1 FROM tb_finca WHERE id=p_id AND tb_proyecto_id=p_proyecto_id);
        IF lower(trim(p_accion)) = 'insertar' THEN v_datos := v_datos || jsonb_build_object('tb_proyecto_id', p_proyecto_id); END IF;
    ELSIF p_tabla = 'tb_sector' THEN
        v_pertenece := p_id IS NULL OR EXISTS (SELECT 1 FROM tb_sector s JOIN tb_finca f ON f.id=s.tb_finca_id WHERE s.id=p_id AND f.tb_proyecto_id=p_proyecto_id);
        IF lower(trim(p_accion)) IN ('insertar','actualizar') AND v_datos ? 'tb_finca_id'
           AND NOT EXISTS (SELECT 1 FROM tb_finca WHERE id=(v_datos->>'tb_finca_id')::INT AND tb_proyecto_id=p_proyecto_id) THEN
            RAISE EXCEPTION 'La finca seleccionada no pertenece al proyecto.';
        END IF;
    ELSIF p_tabla = 'tb_nodo_iot' THEN
        v_pertenece := p_id IS NULL OR EXISTS (SELECT 1 FROM tb_nodo_iot n JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id WHERE n.id=p_id AND f.tb_proyecto_id=p_proyecto_id);
        IF lower(trim(p_accion)) IN ('insertar','actualizar') AND v_datos ? 'tb_sector_id'
           AND NOT EXISTS (SELECT 1 FROM tb_sector s JOIN tb_finca f ON f.id=s.tb_finca_id WHERE s.id=(v_datos->>'tb_sector_id')::INT AND f.tb_proyecto_id=p_proyecto_id) THEN
            RAISE EXCEPTION 'El sector seleccionado no pertenece al proyecto.';
        END IF;
    ELSIF p_tabla = 'tb_sensor_actuador' THEN
        v_pertenece := p_id IS NULL OR EXISTS (SELECT 1 FROM tb_sensor_actuador sa JOIN tb_nodo_iot n ON n.id=sa.tb_nodo_id JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id WHERE sa.id=p_id AND f.tb_proyecto_id=p_proyecto_id);
        IF lower(trim(p_accion)) IN ('insertar','actualizar') AND v_datos ? 'tb_nodo_id'
           AND NOT EXISTS (SELECT 1 FROM tb_nodo_iot n JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id WHERE n.id=(v_datos->>'tb_nodo_id')::INT AND f.tb_proyecto_id=p_proyecto_id) THEN
            RAISE EXCEPTION 'El nodo seleccionado no pertenece al proyecto.';
        END IF;
    ELSE
        v_pertenece := TRUE;
    END IF;

    IF NOT v_pertenece THEN RAISE EXCEPTION 'El registro no pertenece al proyecto seleccionado.'; END IF;

    CASE lower(trim(p_accion))
        WHEN 'insertar' THEN
            SELECT string_agg(format('%I', key), ', '), string_agg(quote_literal(value), ', ')
            INTO v_columnas, v_valores FROM jsonb_each_text(v_datos);
            IF v_columnas IS NULL THEN RAISE EXCEPTION 'No se recibieron datos para insertar.'; END IF;
            SELECT pg_get_serial_sequence(p_tabla, 'id') INTO v_sequence_name;
            IF v_sequence_name IS NOT NULL THEN
                EXECUTE format('SELECT COALESCE(MAX(id),0) FROM %I',p_tabla) INTO v_max_id;
                PERFORM setval(v_sequence_name,GREATEST(v_max_id,1),v_max_id>0);
            END IF;
            EXECUTE format('INSERT INTO %I (%s) VALUES (%s)',p_tabla,v_columnas,v_valores);
        WHEN 'actualizar' THEN
            IF p_id IS NULL THEN RAISE EXCEPTION 'Debe indicar el id.'; END IF;
            SELECT string_agg(format('%I = %L',key,value),', ') INTO v_asignaciones FROM jsonb_each_text(v_datos);
            IF v_asignaciones IS NULL THEN RAISE EXCEPTION 'No se recibieron datos para actualizar.'; END IF;
            EXECUTE format('UPDATE %I SET %s WHERE id = %L',p_tabla,v_asignaciones,p_id);
            GET DIAGNOSTICS v_rows_affected=ROW_COUNT;
        WHEN 'eliminar' THEN
            IF p_id IS NULL THEN RAISE EXCEPTION 'Debe indicar el id.'; END IF;
            EXECUTE format('DELETE FROM %I WHERE id = $1',p_tabla) USING p_id;
            GET DIAGNOSTICS v_rows_affected=ROW_COUNT;
        ELSE RAISE EXCEPTION 'La acción indicada no es válida.';
    END CASE;
END;
$$;
