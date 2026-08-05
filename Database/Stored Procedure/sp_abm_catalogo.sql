CREATE OR REPLACE PROCEDURE sp_abm_catalogo(
    IN p_tabla VARCHAR,
    IN p_accion VARCHAR,
    IN p_id INTEGER DEFAULT NULL,
    IN p_datos JSONB DEFAULT '{}'::JSONB
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_columnas TEXT;
    v_valores TEXT;
    v_asignaciones TEXT;
    v_sequence_name TEXT;
    v_max_id BIGINT;
    v_rows_affected BIGINT;
BEGIN
    IF p_tabla NOT IN (
        'tb_finca',
        'tb_sector',
        'tb_cliente',
        'tb_rol',
        'tb_nodo_iot',
        'tb_sensor_actuador'
    ) THEN
        RAISE EXCEPTION 'La tabla solicitada no está habilitada para ABM dinámico.';
    END IF;

    CASE LOWER(TRIM(p_accion))
        WHEN 'insertar' THEN
            SELECT
                string_agg(format('%I', key), ', '),
                string_agg(quote_literal(value), ', ')
            INTO v_columnas, v_valores
            FROM jsonb_each_text(COALESCE(p_datos, '{}'::JSONB))
            WHERE key <> 'id';

            IF v_columnas IS NULL OR v_valores IS NULL THEN
                RAISE EXCEPTION 'No se recibieron datos para insertar en %.', p_tabla;
            END IF;

            -- Sincroniza la secuencia para evitar colisiones de PK cuando hubo cargas manuales con id.
            SELECT pg_get_serial_sequence(p_tabla, 'id') INTO v_sequence_name;

            IF v_sequence_name IS NOT NULL THEN
                EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', p_tabla)
                INTO v_max_id;

                PERFORM setval(
                    v_sequence_name,
                    GREATEST(v_max_id, 1),
                    v_max_id > 0
                );
            END IF;

            EXECUTE format(
                'INSERT INTO %I (%s) VALUES (%s)',
                p_tabla,
                v_columnas,
                v_valores
            );

        WHEN 'actualizar' THEN
            IF p_id IS NULL THEN
                RAISE EXCEPTION 'Debe indicar el id del registro para actualizar %.', p_tabla;
            END IF;

            SELECT string_agg(format('%I = %L', key, value), ', ')
            INTO v_asignaciones
            FROM jsonb_each_text(COALESCE(p_datos, '{}'::JSONB))
            WHERE key <> 'id';

            IF v_asignaciones IS NULL THEN
                RAISE EXCEPTION 'No se recibieron datos para actualizar en %.', p_tabla;
            END IF;

            EXECUTE format(
                'UPDATE %I SET %s WHERE id = %L',
                p_tabla,
                v_asignaciones,
                p_id
            );

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected = 0 THEN
                RAISE EXCEPTION 'El registro % no existe en %.', p_id, p_tabla;
            END IF;

        WHEN 'eliminar' THEN
            IF p_id IS NULL THEN
                RAISE EXCEPTION 'Debe indicar el id del registro para eliminar de %.', p_tabla;
            END IF;

            EXECUTE format(
                'DELETE FROM %I WHERE id = $1',
                p_tabla
            ) USING p_id;

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected = 0 THEN
                RAISE EXCEPTION 'El registro % no existe en %.', p_id, p_tabla;
            END IF;

        ELSE
            RAISE EXCEPTION 'La acción % no es válida para el ABM dinámico.', p_accion;
    END CASE;
END;
$$;