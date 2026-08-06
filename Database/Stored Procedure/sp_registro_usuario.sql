DROP PROCEDURE IF EXISTS sp_registro_usuario(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER);

CREATE OR REPLACE PROCEDURE sp_registro_usuario(
    IN p_nombres VARCHAR,
    IN p_apellidos VARCHAR,
    IN p_correo_electronico VARCHAR,
    IN p_username VARCHAR,
    IN p_codigo_pais VARCHAR,
    IN p_telefono VARCHAR,
    IN p_password_hash VARCHAR,
    IN p_tb_rol_id INTEGER DEFAULT 2,
    IN p_cod_usuario_registro INTEGER DEFAULT 1
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_persona_id INTEGER;
    v_username VARCHAR;
    v_codigo_pais VARCHAR;
    v_telefono VARCHAR;
BEGIN
    v_username := lower(COALESCE(NULLIF(trim(p_username), ''), split_part(p_correo_electronico, '@', 1)));
    v_codigo_pais := NULLIF(trim(p_codigo_pais), '');
    v_telefono := NULLIF(regexp_replace(p_telefono, '[^0-9]', '', 'g'), '');

    IF EXISTS (
        SELECT 1
        FROM tb_usuario
        WHERE lower(correo_electronico) = lower(trim(p_correo_electronico))
    ) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado.';
    END IF;

    IF EXISTS (SELECT 1 FROM tb_usuario WHERE lower(username) = v_username) THEN
        RAISE EXCEPTION 'El nombre de usuario ya existe.';
    END IF;

    IF v_telefono IS NOT NULL AND EXISTS (
        SELECT 1 FROM tb_usuario
        WHERE codigo_pais = v_codigo_pais AND telefono = v_telefono
    ) THEN
        RAISE EXCEPTION 'El número de teléfono ya está registrado.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_rol WHERE id = p_tb_rol_id) THEN
        RAISE EXCEPTION 'El rol seleccionado no existe.';
    END IF;

    INSERT INTO tb_persona (
        nombres,
        apellidos,
        cod_usuario_registro,
        fecha_registra
    )
    VALUES (
        p_nombres,
        p_apellidos,
        p_cod_usuario_registro,
        NOW()
    )
    RETURNING id INTO v_persona_id;

    INSERT INTO tb_usuario (
        tb_persona_id,
        tb_rol_id,
        correo_electronico,
        username,
        codigo_pais,
        telefono,
        password_hash,
        sn_activo,
        cod_usuario_registro,
        fecha_registra
    )
    VALUES (
        v_persona_id,
        p_tb_rol_id,
        lower(trim(p_correo_electronico)),
        v_username,
        v_codigo_pais,
        v_telefono,
        p_password_hash,
        TRUE,
        p_cod_usuario_registro,
        NOW()
    );
END;
$$;
