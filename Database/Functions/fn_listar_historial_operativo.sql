CREATE OR REPLACE FUNCTION fn_listar_historial_operativo(p_proyecto_id INT,p_usuario_id INT)
RETURNS TABLE(id TEXT,categoria VARCHAR,origen VARCHAR,titulo TEXT,detalle TEXT,entidad VARCHAR,entidad_id INT,fecha_hora TIMESTAMP,valores_anteriores JSONB,valores_nuevos JSONB)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE) THEN RAISE EXCEPTION 'No tienes acceso a este proyecto.'; END IF;
    RETURN QUERY SELECT q.* FROM (
        SELECT 'B-'||b.id AS id,b.categoria,b.origen,b.accion_realizada::TEXT AS titulo,b.detalle,b.entidad,b.entidad_id,b.fecha_hora,b.valores_anteriores,b.valores_nuevos
        FROM tb_bitacora_auditoria b WHERE b.tb_proyecto_id=p_proyecto_id
        UNION ALL
        SELECT 'N-'||n.id,'HARDWARE'::VARCHAR,'SISTEMA'::VARCHAR,
               ('Nodo #'||n.id||' inició funcionamiento')::TEXT,
               ('Primera telemetría recibida por '||n.tipo_nodo)::TEXT,'tb_nodo_iot'::VARCHAR,n.id,MIN(t.fecha_hora),NULL::JSONB,
               jsonb_build_object('estado','EN FUNCIONAMIENTO')
        FROM tb_nodo_iot n JOIN tb_sensor s ON s.tb_nodo_id=n.id JOIN tb_telemetria t ON t.tb_sensor_id=s.id
        JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
        WHERE f.tb_proyecto_id=p_proyecto_id GROUP BY n.id,n.tipo_nodo
    ) q ORDER BY q.fecha_hora DESC;
END;
$$;
