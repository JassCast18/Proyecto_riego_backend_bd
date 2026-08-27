CREATE OR REPLACE PROCEDURE sp_registrar_entrega_alerta(
    IN p_notificacion_id BIGINT,IN p_usuario_id INT,
    IN p_estado VARCHAR,IN p_error VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO tb_notificacion_entrega(
        tb_notificacion_id,tb_usuario_id,canal,estado,intentos,ultimo_error,
        fecha_ultimo_intento,fecha_envio
    ) VALUES(
        p_notificacion_id,p_usuario_id,'EMAIL',p_estado,1,left(p_error,500),
        NOW(),CASE WHEN p_estado='ENVIADO' THEN NOW() END
    )
    ON CONFLICT(tb_notificacion_id,tb_usuario_id,canal)
    DO UPDATE SET estado=EXCLUDED.estado,intentos=tb_notificacion_entrega.intentos+1,
        ultimo_error=EXCLUDED.ultimo_error,fecha_ultimo_intento=NOW(),
        fecha_envio=CASE WHEN EXCLUDED.estado='ENVIADO' THEN NOW()
                         ELSE tb_notificacion_entrega.fecha_envio END;

    IF p_estado='ENVIADO' THEN
        UPDATE tb_notificacion SET fecha_correo_enviado=COALESCE(fecha_correo_enviado,NOW())
        WHERE id=p_notificacion_id;
    END IF;
END;
$$;
