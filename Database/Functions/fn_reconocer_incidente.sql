DROP FUNCTION IF EXISTS fn_reconocer_incidente(BIGINT,INT,INT,INT);

CREATE OR REPLACE FUNCTION fn_reconocer_incidente(
    p_notificacion_id BIGINT,p_usuario_id INT,p_rol_id INT,p_proyecto_id INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE v_actualizada BOOLEAN;
BEGIN
    UPDATE tb_notificacion
    SET estado='RECONOCIDA',reconocida_por=p_usuario_id,
        fecha_reconocimiento=NOW(),fecha_actualizacion=NOW()
    WHERE id=p_notificacion_id AND tb_proyecto_id=p_proyecto_id
      AND (p_rol_id=1 OR tb_rol_id IS NULL OR tb_rol_id=p_rol_id) AND estado='ACTIVA'
    RETURNING TRUE INTO v_actualizada;

    IF COALESCE(v_actualizada,FALSE) THEN
        INSERT INTO tb_notificacion_usuario(
            tb_notificacion_id,tb_usuario_id,revisada,fecha_revision
        ) VALUES(p_notificacion_id,p_usuario_id,TRUE,NOW())
        ON CONFLICT(tb_notificacion_id,tb_usuario_id)
        DO UPDATE SET revisada=TRUE,fecha_revision=NOW();
    END IF;
    RETURN COALESCE(v_actualizada,FALSE);
END;
$$;
