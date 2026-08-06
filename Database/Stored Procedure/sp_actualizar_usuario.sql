DROP PROCEDURE IF EXISTS sp_actualizar_usuario(INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, BOOLEAN, INTEGER);
DROP PROCEDURE IF EXISTS sp_actualizar_usuario(INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, BOOLEAN, INTEGER);

CREATE OR REPLACE PROCEDURE sp_actualizar_usuario(
    IN p_usuario_id INTEGER,
    IN p_nombres VARCHAR,
    IN p_apellidos VARCHAR,
    IN p_correo_electronico VARCHAR,
    IN p_codigo_pais VARCHAR,
    IN p_telefono VARCHAR,
    IN p_tb_rol_id INTEGER,
    IN p_sn_activo BOOLEAN,
    IN p_cod_usuario_modifica INTEGER
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_persona_id INTEGER;
    v_codigo_pais VARCHAR;
    v_telefono VARCHAR;
BEGIN
    v_codigo_pais := NULLIF(trim(p_codigo_pais), '');
    v_telefono := NULLIF(regexp_replace(p_telefono, '[^0-9]', '', 'g'), '');

    SELECT tb_persona_id
    INTO v_persona_id
    FROM tb_usuario
    WHERE id = p_usuario_id;

    IF v_persona_id IS NULL THEN
        RAISE EXCEPTION 'El usuario no existe.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM tb_usuario
        WHERE lower(correo_electronico) = lower(trim(p_correo_electronico))
          AND id <> p_usuario_id
    ) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado por otro usuario.';
    END IF;

    IF v_telefono IS NOT NULL AND EXISTS (
        SELECT 1 FROM tb_usuario
        WHERE codigo_pais = v_codigo_pais
          AND telefono = v_telefono
          AND id <> p_usuario_id
    ) THEN
        RAISE EXCEPTION 'El número de teléfono ya está registrado por otro usuario.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_rol WHERE id = p_tb_rol_id) THEN
        RAISE EXCEPTION 'El rol seleccionado no existe.';
    END IF;

    UPDATE tb_persona
    SET nombres = p_nombres,
        apellidos = p_apellidos,
        cod_usuario_modifica = p_cod_usuario_modifica,
        fecha_modifica = NOW()
    WHERE id = v_persona_id;

    UPDATE tb_usuario
    SET correo_electronico = lower(trim(p_correo_electronico)),
        codigo_pais = v_codigo_pais,
        telefono = v_telefono,
        tb_rol_id = p_tb_rol_id,
        sn_activo = p_sn_activo,
        cod_usuario_modifica = p_cod_usuario_modifica,
        fecha_modifica = NOW()
    WHERE id = p_usuario_id;
END;
$$;
