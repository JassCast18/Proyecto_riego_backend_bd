CREATE OR REPLACE PROCEDURE sp_restablecer_password(
    IN p_token_hash VARCHAR,
    IN p_password_hash VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_recuperacion_id BIGINT;
    v_usuario_id INT;
BEGIN
    SELECT id, tb_usuario_id
    INTO v_recuperacion_id, v_usuario_id
    FROM tb_recuperacion_password
    WHERE token_hash = p_token_hash
      AND utilizado = FALSE
      AND fecha_expiracion > NOW()
    FOR UPDATE;

    IF v_recuperacion_id IS NULL THEN
        RAISE EXCEPTION 'El enlace de recuperación es inválido o expiró.';
    END IF;

    UPDATE tb_usuario
    SET password_hash = p_password_hash,
        cod_usuario_modifica = v_usuario_id,
        fecha_modifica = NOW()
    WHERE id = v_usuario_id;

    UPDATE tb_recuperacion_password
    SET utilizado = TRUE,
        fecha_utilizacion = NOW()
    WHERE id = v_recuperacion_id;
END;
$$;
