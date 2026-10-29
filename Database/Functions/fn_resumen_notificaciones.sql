CREATE OR REPLACE FUNCTION fn_resumen_notificaciones(p_usuario_id INT,p_rol_id INT,p_proyecto_id INT)
RETURNS TABLE(activas BIGINT,reconocidas BIGINT,criticas BIGINT,resueltas BIGINT)
LANGUAGE sql
AS $$
    SELECT count(*) FILTER(WHERE n.estado='ACTIVA' AND NOT (n.severidad='INFO' AND COALESCE(nu.revisada,FALSE)=TRUE)),
           count(*) FILTER(WHERE n.estado='RECONOCIDA'),
           count(*) FILTER(WHERE n.estado<>'RESUELTA' AND n.severidad='CRITICAL'),
           count(*) FILTER(WHERE n.estado='RESUELTA')
    FROM tb_notificacion n
    JOIN tb_usuario usuario_bandeja ON usuario_bandeja.id=p_usuario_id
    JOIN tb_usuario_rol acceso_bandeja
      ON acceso_bandeja.tb_usuario_id=p_usuario_id
     AND acceso_bandeja.tb_proyecto_id=p_proyecto_id
     AND acceso_bandeja.sn_activo=TRUE
    LEFT JOIN tb_notificacion_usuario nu
      ON nu.tb_notificacion_id=n.id AND nu.tb_usuario_id=p_usuario_id
    LEFT JOIN LATERAL (
      SELECT x.tb_usuario_id FROM tb_notificacion_usuario x
      WHERE x.tb_notificacion_id=n.id AND x.revisada=TRUE
      ORDER BY x.fecha_revision ASC,x.tb_usuario_id ASC LIMIT 1
    ) rv ON TRUE
    WHERE n.tb_proyecto_id=p_proyecto_id AND n.estado<>'PENDIENTE'
      AND (
        n.fecha_creacion >= GREATEST(usuario_bandeja.fecha_registra,acceso_bandeja.fecha_registra)
        OR (
          n.estado IN ('ACTIVA','RECONOCIDA')
          AND COALESCE(n.fecha_ultima_deteccion,n.fecha_actualizacion) >= GREATEST(usuario_bandeja.fecha_registra,acceso_bandeja.fecha_registra)
        )
      )
      AND (n.tb_usuario_destino_id IS NULL OR n.tb_usuario_destino_id=p_usuario_id)
      AND COALESCE(nu.descartada,FALSE)=FALSE
      AND (p_rol_id=1 OR n.tb_rol_id IS NULL OR n.tb_rol_id=p_rol_id)
      AND (
        (n.severidad='CRITICAL'
          AND (n.estado='ACTIVA' OR fn_es_propietario(p_usuario_id) OR n.reconocida_por=p_usuario_id)
          AND (fn_es_propietario(p_usuario_id) OR n.reconocida_por=p_usuario_id
            OR rv.tb_usuario_id IS NULL OR rv.tb_usuario_id=p_usuario_id))
        OR (n.severidad<>'CRITICAL'
          AND (n.reconocida_por IS NULL OR n.reconocida_por=p_usuario_id)
          AND (rv.tb_usuario_id IS NULL OR rv.tb_usuario_id=p_usuario_id))
      );
$$;
