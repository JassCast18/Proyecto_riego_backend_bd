CREATE OR REPLACE PROCEDURE sp_registro_usuario(
    IN p_nombres VARCHAR,
    IN p_apellidos VARCHAR,
    IN p_correo_electronico VARCHAR,
    IN p_username VARCHAR DEFAULT NULL,
    IN p_password_hash VARCHAR,
    IN p_tb_rol_id INTEGER DEFAULT 2,
    IN p_cod_usuario_registro INTEGER DEFAULT 1
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_persona_id INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM tb_usuario
        WHERE correo_electronico = p_correo_electronico
    ) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado.';
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
        password_hash,
        sn_activo,
        cod_usuario_registro,
        fecha_registra
    )
    VALUES (
        v_persona_id,
        p_tb_rol_id,
        p_correo_electronico,
        COALESCE(NULLIF(p_username, ''), split_part(p_correo_electronico, '@', 1)),
        p_password_hash,
        TRUE,
        p_cod_usuario_registro,
        NOW()
    );
END;
$$;