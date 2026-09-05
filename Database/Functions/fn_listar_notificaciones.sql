DROP FUNCTION IF EXISTS fn_listar_notificaciones(INT,INT,VARCHAR,INT);
DROP FUNCTION IF EXISTS fn_listar_notificaciones(INT,INT,INT,VARCHAR,INT);
DROP FUNCTION IF EXISTS fn_listar_notificaciones(INT,INT,INT,VARCHAR,VARCHAR,INT,INT);

CREATE OR REPLACE FUNCTION fn_listar_notificaciones(
    p_usuario_id INT,p_rol_id INT,p_proyecto_id INT,
    p_estado VARCHAR DEFAULT 'active',p_revisor VARCHAR DEFAULT 'all',
    p_pagina INT DEFAULT 1,p_tamano_pagina INT DEFAULT 10
)
RETURNS TABLE (
    id BIGINT,tb_nodo_id INT,categoria VARCHAR,tipo VARCHAR,titulo VARCHAR,
    mensaje VARCHAR,severidad VARCHAR,estado VARCHAR,descartable BOOLEAN,
    fecha_creacion TIMESTAMP,fecha_actualizacion TIMESTAMP,fecha_resolucion TIMESTAMP,
    revisada BOOLEAN,reconocida_por INT,reconocido_por_nombre VARCHAR,
    fecha_reconocimiento TIMESTAMP,fecha_primera_deteccion TIMESTAMP,
    fecha_ultima_deteccion TIMESTAMP,ocurrencias INT,correo_enviado BOOLEAN,
    estado_correo VARCHAR,revisada_por INT,revisada_por_nombre VARCHAR,
    fecha_revision TIMESTAMP,total_registros BIGINT
)
LANGUAGE sql
AS $$
    SELECT fn_sincronizar_pruebas_actuador(p_proyecto_id,NULL);
    WITH visibles AS (
        SELECT n.*,COALESCE(nu.revisada,FALSE) AS revisada_usuario,
               rv.tb_usuario_id AS revisada_por_id,rv.fecha_revision AS fecha_revision_general
        FROM tb_notificacion n
        LEFT JOIN tb_notificacion_usuario nu
          ON nu.tb_notificacion_id=n.id AND nu.tb_usuario_id=p_usuario_id
        LEFT JOIN LATERAL (
            SELECT x.tb_usuario_id,x.fecha_revision
            FROM tb_notificacion_usuario x
            WHERE x.tb_notificacion_id=n.id AND x.revisada=TRUE
            ORDER BY x.fecha_revision ASC,x.tb_usuario_id ASC LIMIT 1
        ) rv ON TRUE
        WHERE n.tb_proyecto_id=p_proyecto_id AND n.estado<>'PENDIENTE'
          AND COALESCE(nu.descartada,FALSE)=FALSE
          AND (p_rol_id=1 OR n.tb_rol_id IS NULL OR n.tb_rol_id=p_rol_id)
          AND (p_rol_id=1 OR n.estado='ACTIVA' OR n.reconocida_por=p_usuario_id)
          AND (
              lower(COALESCE(p_estado,'active'))='all'
              OR (lower(p_estado)='active' AND n.estado IN ('ACTIVA','RECONOCIDA')
                  AND NOT (n.severidad='INFO' AND COALESCE(nu.revisada,FALSE)=TRUE))
              OR (lower(p_estado)='acknowledged' AND n.estado='RECONOCIDA')
              OR (lower(p_estado)='resolved' AND n.estado='RESUELTA')
          )
          AND (
              p_rol_id<>1 OR lower(COALESCE(p_revisor,'all'))='all'
              OR (lower(p_revisor)='unreviewed' AND rv.tb_usuario_id IS NULL)
              OR (p_revisor ~ '^[0-9]+$' AND EXISTS(
                  SELECT 1 FROM tb_notificacion_usuario x
                  WHERE x.tb_notificacion_id=n.id AND x.revisada=TRUE
                    AND x.tb_usuario_id=CASE WHEN p_revisor ~ '^[0-9]+$' THEN p_revisor::INT END
              ))
          )
    )
    SELECT v.id,v.tb_nodo_id,v.categoria,v.tipo,v.titulo,v.mensaje,v.severidad,
           v.estado,v.descartable,v.fecha_creacion,v.fecha_actualizacion,
           v.fecha_resolucion,v.revisada_usuario,v.reconocida_por,
           concat_ws(' ',pre.nombres,pre.apellidos)::VARCHAR,v.fecha_reconocimiento,
           v.fecha_primera_deteccion,v.fecha_ultima_deteccion,v.ocurrencias,
           (v.fecha_correo_enviado IS NOT NULL),
           CASE
             WHEN v.fecha_correo_enviado IS NOT NULL THEN 'ENVIADO'
             WHEN EXISTS(SELECT 1 FROM tb_notificacion_entrega e WHERE e.tb_notificacion_id=v.id AND e.estado='FALLIDO') THEN 'FALLIDO'
             WHEN v.estado='ACTIVA' AND v.severidad IN ('WARNING','CRITICAL') THEN 'PENDIENTE'
             ELSE NULL
           END::VARCHAR,
           v.revisada_por_id,concat_ws(' ',prv.nombres,prv.apellidos)::VARCHAR,
           v.fecha_revision_general,COUNT(*) OVER()
    FROM visibles v
    LEFT JOIN tb_usuario ure ON ure.id=v.reconocida_por
    LEFT JOIN tb_persona pre ON pre.id=ure.tb_persona_id
    LEFT JOIN tb_usuario urv ON urv.id=v.revisada_por_id
    LEFT JOIN tb_persona prv ON prv.id=urv.tb_persona_id
    ORDER BY CASE v.estado WHEN 'ACTIVA' THEN 0 WHEN 'RECONOCIDA' THEN 1 ELSE 2 END,
             CASE v.severidad WHEN 'CRITICAL' THEN 0 WHEN 'WARNING' THEN 1 ELSE 2 END,
             v.fecha_actualizacion DESC
    LIMIT LEAST(GREATEST(COALESCE(p_tamano_pagina,10),1),50)
    OFFSET (GREATEST(COALESCE(p_pagina,1),1)-1)*LEAST(GREATEST(COALESCE(p_tamano_pagina,10),1),50);
$$;
