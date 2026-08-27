DROP PROCEDURE IF EXISTS sp_abm_cliente(VARCHAR, INTEGER, JSONB, INTEGER);

CREATE OR REPLACE PROCEDURE sp_abm_cliente(
    IN p_accion VARCHAR,
    IN p_id INTEGER,
    IN p_datos JSONB,
    IN p_usuario_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_accion VARCHAR := lower(trim(p_accion));
    v_persona_id INTEGER;
    v_nombres VARCHAR := NULLIF(trim(p_datos->>'nombres'), '');
    v_apellidos VARCHAR := NULLIF(trim(p_datos->>'apellidos'), '');
    v_direccion VARCHAR := NULLIF(trim(p_datos->>'direccion'), '');
    v_nit VARCHAR := NULLIF(trim(p_datos->>'nit'), '');
    v_telefono VARCHAR := NULLIF(regexp_replace(COALESCE(p_datos->>'telefono', ''), '[^0-9+ -]', '', 'g'), '');
    v_sequence_name TEXT;
    v_max_id BIGINT;
BEGIN
    IF v_accion = 'insertar' THEN
        IF v_nombres IS NULL OR v_apellidos IS NULL THEN
            RAISE EXCEPTION 'El nombre y los apellidos del cliente son obligatorios.';
        END IF;
        IF v_direccion IS NULL THEN
            RAISE EXCEPTION 'La dirección del cliente es obligatoria.';
        END IF;

        SELECT pg_get_serial_sequence('tb_persona', 'id') INTO v_sequence_name;
        SELECT COALESCE(MAX(id), 0) INTO v_max_id FROM tb_persona;
        PERFORM setval(v_sequence_name, GREATEST(v_max_id, 1), v_max_id > 0);

        INSERT INTO tb_persona(nombres, apellidos, cod_usuario_registro, fecha_registra)
        VALUES(v_nombres, v_apellidos, p_usuario_id, CURRENT_TIMESTAMP)
        RETURNING id INTO v_persona_id;

        SELECT pg_get_serial_sequence('tb_cliente', 'id') INTO v_sequence_name;
        SELECT COALESCE(MAX(id), 0) INTO v_max_id FROM tb_cliente;
        PERFORM setval(v_sequence_name, GREATEST(v_max_id, 1), v_max_id > 0);

        INSERT INTO tb_cliente(tb_persona_id, nit, direccion, telefono)
        VALUES(v_persona_id, v_nit, v_direccion, v_telefono);

    ELSIF v_accion = 'actualizar' THEN
        SELECT tb_persona_id INTO v_persona_id FROM tb_cliente WHERE id = p_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'El cliente indicado no existe.'; END IF;

        IF v_persona_id IS NULL THEN
            IF v_nombres IS NULL OR v_apellidos IS NULL THEN
                RAISE EXCEPTION 'Este cliente aún no tiene propietario. Ingresa nombres y apellidos para completar el registro.';
            END IF;
            SELECT pg_get_serial_sequence('tb_persona', 'id') INTO v_sequence_name;
            SELECT COALESCE(MAX(id), 0) INTO v_max_id FROM tb_persona;
            PERFORM setval(v_sequence_name, GREATEST(v_max_id, 1), v_max_id > 0);
            INSERT INTO tb_persona(nombres, apellidos, cod_usuario_registro, fecha_registra)
            VALUES(v_nombres, v_apellidos, p_usuario_id, CURRENT_TIMESTAMP)
            RETURNING id INTO v_persona_id;
            UPDATE tb_cliente SET tb_persona_id=v_persona_id WHERE id=p_id;
        END IF;

        IF p_datos ? 'nombres' AND v_nombres IS NULL THEN
            RAISE EXCEPTION 'El nombre del cliente es obligatorio.';
        END IF;
        IF p_datos ? 'apellidos' AND v_apellidos IS NULL THEN
            RAISE EXCEPTION 'Los apellidos del cliente son obligatorios.';
        END IF;
        IF p_datos ? 'direccion' AND v_direccion IS NULL THEN
            RAISE EXCEPTION 'La dirección del cliente es obligatoria.';
        END IF;

        UPDATE tb_persona SET
            nombres = CASE WHEN p_datos ? 'nombres' THEN v_nombres ELSE nombres END,
            apellidos = CASE WHEN p_datos ? 'apellidos' THEN v_apellidos ELSE apellidos END,
            cod_usuario_modifica = p_usuario_id,
            fecha_modifica = CURRENT_TIMESTAMP,
            fecha_modificacion = CURRENT_TIMESTAMP
        WHERE id = v_persona_id;

        UPDATE tb_cliente SET
            nit = CASE WHEN p_datos ? 'nit' THEN v_nit ELSE nit END,
            direccion = CASE WHEN p_datos ? 'direccion' THEN v_direccion ELSE direccion END,
            telefono = CASE WHEN p_datos ? 'telefono' THEN v_telefono ELSE telefono END
        WHERE id = p_id;

    ELSIF v_accion = 'eliminar' THEN
        SELECT tb_persona_id INTO v_persona_id FROM tb_cliente WHERE id = p_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'El cliente indicado no existe.'; END IF;
        IF EXISTS (SELECT 1 FROM tb_finca WHERE tb_cliente_id = p_id) THEN
            RAISE EXCEPTION 'No puedes eliminar este cliente porque es dueño de una o más fincas.';
        END IF;

        DELETE FROM tb_cliente WHERE id = p_id;
        DELETE FROM tb_persona p
        WHERE p.id = v_persona_id
          AND NOT EXISTS (SELECT 1 FROM tb_usuario u WHERE u.tb_persona_id = p.id)
          AND NOT EXISTS (SELECT 1 FROM tb_cliente c WHERE c.tb_persona_id = p.id);
    ELSE
        RAISE EXCEPTION 'La acción indicada no es válida.';
    END IF;
END;
$$;
