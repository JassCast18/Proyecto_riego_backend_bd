CREATE OR REPLACE FUNCTION fn_obtener_estado_ia(p_proyecto_id INT)
RETURNS TABLE(modelo JSONB,versiones JSONB,decisiones JSONB,total_dataset BIGINT)
LANGUAGE sql AS $$
 SELECT
  (SELECT to_jsonb(v) FROM tb_version_modelo_ia v WHERE v.tb_proyecto_id=p_proyecto_id AND v.sn_activo ORDER BY v.fecha_entrenamiento DESC LIMIT 1),
  COALESCE((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.fecha_entrenamiento DESC) FROM (SELECT * FROM tb_version_modelo_ia WHERE tb_proyecto_id=p_proyecto_id ORDER BY fecha_entrenamiento DESC LIMIT 10)v),'[]'::jsonb),
  COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.fecha_hora DESC) FROM (SELECT * FROM tb_decision_ia WHERE tb_proyecto_id=p_proyecto_id ORDER BY fecha_hora DESC LIMIT 10)d),'[]'::jsonb),
  (SELECT LEAST(COUNT(*),10000)
   FROM tb_telemetria t JOIN tb_sensor s ON s.id=t.tb_sensor_id
   JOIN tb_nodo_iot n ON n.id=s.tb_nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
   JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
   WHERE f.tb_proyecto_id=p_proyecto_id
     AND (s.tipo_componente ILIKE '%higr%' OR s.tipo_componente ILIKE '%humedad_suelo%')
     AND pc.humedad_suelo_minima IS NOT NULL AND pc.humedad_suelo_maxima IS NOT NULL);
$$;
