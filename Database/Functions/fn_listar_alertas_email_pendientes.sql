CREATE OR REPLACE FUNCTION fn_listar_alertas_email_pendientes(p_proyecto_id INT)
RETURNS TABLE(
    notificacion_id BIGINT,usuario_id INT,correo VARCHAR,nombre VARCHAR,
    proyecto VARCHAR,titulo VARCHAR,mensaje VARCHAR,severidad VARCHAR,
    categoria VARCHAR,fecha_primera_deteccion TIMESTAMP,ocurrencias INT
)
LANGUAGE sql
AS $$
    SELECT n.id,u.id,u.correo_electronico,
           concat_ws(' ',pe.nombres,pe.apellidos)::VARCHAR,p.nombre,
           n.titulo,n.mensaje,n.severidad,n.categoria,
           n.fecha_primera_deteccion,n.ocurrencias
    FROM tb_notificacion n
    JOIN tb_proyecto p ON p.id=n.tb_proyecto_id
    JOIN tb_usuario_rol ur ON ur.tb_proyecto_id=n.tb_proyecto_id
      AND ur.sn_activo=TRUE AND ur.recibe_alertas_correo=TRUE
    JOIN tb_rol r ON r.id=ur.tb_rol_id AND lower(r.nombre_rol)='administrador'
    JOIN tb_usuario u ON u.id=ur.tb_usuario_id AND u.sn_activo=TRUE
    LEFT JOIN tb_persona pe ON pe.id=u.tb_persona_id
    LEFT JOIN tb_notificacion_entrega e
      ON e.tb_notificacion_id=n.id AND e.tb_usuario_id=u.id AND e.canal='EMAIL'
    WHERE n.tb_proyecto_id=p_proyecto_id AND n.estado='ACTIVA'
      AND n.severidad IN ('WARNING','CRITICAL')
      AND (e.id IS NULL OR (e.estado='FALLIDO' AND e.intentos<3
           AND e.fecha_ultimo_intento<=NOW()-INTERVAL '5 minutes'));
$$;
