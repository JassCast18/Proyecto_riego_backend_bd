CREATE OR REPLACE FUNCTION fn_validar_token_recuperacion(
    p_token_hash VARCHAR
)
RETURNS BOOLEAN
LANGUAGE sql
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM tb_recuperacion_password
        WHERE token_hash = p_token_hash
          AND utilizado = FALSE
          AND fecha_expiracion > NOW()
    );
$$;
