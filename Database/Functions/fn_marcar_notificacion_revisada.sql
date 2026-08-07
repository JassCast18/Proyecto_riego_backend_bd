DROP FUNCTION IF EXISTS fn_marcar_notificacion_revisada(BIGINT, INT, INT);
DROP FUNCTION IF EXISTS fn_marcar_notificacion_revisada(BIGINT, INT, INT, INT);

CREATE OR REPLACE FUNCTION fn_marcar_notificacion_revisada(
    p_notificacion_id BIGINT,
    p_usuario_id INT,
    p_rol_id INT,
    p_proyecto_id INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_filas_afectadas INT;
BEGIN
    INSERT INTO tb_notificacion_usuario (
        tb_notificacion_id,
        tb_usuario_id,
        revisada,
        fecha_revision
    )
    SELECT id, p_usuario_id, TRUE, NOW()
    FROM tb_notificacion
    WHERE id = p_notificacion_id
      AND (tb_rol_id IS NULL OR tb_rol_id = p_rol_id)
      AND tb_proyecto_id = p_proyecto_id
    ON CONFLICT (tb_notificacion_id, tb_usuario_id)
    DO UPDATE SET revisada = TRUE, fecha_revision = NOW();

    GET DIAGNOSTICS v_filas_afectadas = ROW_COUNT;
    RETURN v_filas_afectadas > 0;
END;
$$;
