CREATE OR REPLACE PROCEDURE sp_crear_token_recuperacion(
    IN p_usuario_id INT,
    IN p_token_hash VARCHAR,
    IN p_fecha_expiracion TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE tb_recuperacion_password
    SET utilizado = TRUE
    WHERE tb_usuario_id = p_usuario_id
      AND utilizado = FALSE;

    INSERT INTO tb_recuperacion_password (
        tb_usuario_id,
        token_hash,
        fecha_expiracion
    ) VALUES (
        p_usuario_id,
        p_token_hash,
        p_fecha_expiracion
    );
END;
$$;
