DROP FUNCTION IF EXISTS fn_listar_historial_operativo(INT,INT);
DROP FUNCTION IF EXISTS fn_listar_historial_operativo(INT,INT,VARCHAR,DATE,DATE,INT,INT);

CREATE OR REPLACE FUNCTION fn_listar_historial_operativo(
    p_proyecto_id INT,
    p_usuario_id INT,
    p_categoria VARCHAR DEFAULT NULL,
    p_desde DATE DEFAULT NULL,
    p_hasta DATE DEFAULT NULL,
    p_pagina INT DEFAULT 1,
    p_tamano INT DEFAULT 10
)
RETURNS TABLE(
    id TEXT,categoria VARCHAR,origen VARCHAR,titulo TEXT,detalle TEXT,
    entidad VARCHAR,entidad_id INT,fecha_hora TIMESTAMP,
    valores_anteriores JSONB,valores_nuevos JSONB,total_registros BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE
    ) THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto.';
    END IF;

    RETURN QUERY
    WITH eventos AS (
        SELECT 'B-'||b.id AS id,b.categoria,b.origen,b.accion_realizada::TEXT AS titulo,
               b.detalle,b.entidad,b.entidad_id,b.fecha_hora,b.valores_anteriores,b.valores_nuevos
        FROM tb_bitacora_auditoria b
        WHERE b.tb_proyecto_id=p_proyecto_id
        UNION ALL
        SELECT 'N-'||n.id,'HARDWARE'::VARCHAR,'SISTEMA'::VARCHAR,
               ('Nodo #'||n.id||' inició funcionamiento')::TEXT,
               ('Primera telemetría recibida por '||n.tipo_nodo)::TEXT,
               'tb_nodo_iot'::VARCHAR,n.id,MIN(t.fecha_hora),NULL::JSONB,
               jsonb_build_object('estado','EN FUNCIONAMIENTO')
        FROM tb_nodo_iot n
        JOIN tb_sensor s ON s.tb_nodo_id=n.id
        JOIN tb_telemetria t ON t.tb_sensor_id=s.id
        JOIN tb_sector se ON se.id=n.tb_sector_id
        JOIN tb_finca f ON f.id=se.tb_finca_id
        WHERE f.tb_proyecto_id=p_proyecto_id
        GROUP BY n.id,n.tipo_nodo
    ), filtrados AS (
        SELECT e.*
        FROM eventos e
        WHERE (COALESCE(trim(p_categoria),'')='' OR upper(e.categoria)=upper(trim(p_categoria)))
          AND (p_desde IS NULL OR e.fecha_hora>=p_desde::TIMESTAMP)
          AND (p_hasta IS NULL OR e.fecha_hora<(p_hasta+1)::TIMESTAMP)
    )
    SELECT f.*,COUNT(*) OVER() AS total_registros
    FROM filtrados f
    ORDER BY f.fecha_hora DESC
    LIMIT LEAST(GREATEST(COALESCE(p_tamano,10),1),50)
    OFFSET (GREATEST(COALESCE(p_pagina,1),1)-1)*LEAST(GREATEST(COALESCE(p_tamano,10),1),50);
END;
$$;
