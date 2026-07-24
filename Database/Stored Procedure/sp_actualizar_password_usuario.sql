CREATE OR REPLACE PROCEDURE sp_actualizar_password_usuario(
    IN p_usuario_id INTEGER,
    IN p_password_hash VARCHAR,
    IN p_cod_usuario_modifica INTEGER
)
LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE tb_usuario
    SET password_hash = p_password_hash,
        cod_usuario_modifica = p_cod_usuario_modifica,
        fecha_modifica = NOW()
    WHERE id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El usuario no existe.';
    END IF;
END;
$$;