CREATE OR REPLACE PROCEDURE sp_actualizar_usuario(
    IN p_usuario_id INTEGER,
    IN p_nombres VARCHAR,
    IN p_apellidos VARCHAR,
    IN p_correo_electronico VARCHAR,
    IN p_username VARCHAR,
    IN p_tb_rol_id INTEGER,
    IN p_sn_activo BOOLEAN,
    IN p_cod_usuario_modifica INTEGER
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_persona_id INTEGER;
BEGIN
    SELECT tb_persona_id
    INTO v_persona_id
    FROM tb_usuario
    WHERE id = p_usuario_id;

    IF v_persona_id IS NULL THEN
        RAISE EXCEPTION 'El usuario no existe.';
    END IF;

    UPDATE tb_persona
    SET nombres = p_nombres,
        apellidos = p_apellidos,
        cod_usuario_modifica = p_cod_usuario_modifica,
        fecha_modifica = NOW()
    WHERE id = v_persona_id;

    UPDATE tb_usuario
    SET correo_electronico = p_correo_electronico,
        username = COALESCE(NULLIF(p_username, ''), split_part(p_correo_electronico, '@', 1)),
        tb_rol_id = p_tb_rol_id,
        sn_activo = p_sn_activo,
        cod_usuario_modifica = p_cod_usuario_modifica,
        fecha_modifica = NOW()
    WHERE id = p_usuario_id;
END;
$$;