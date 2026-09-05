CREATE OR REPLACE FUNCTION fn_obtener_estado_ia(p_proyecto_id INT)
RETURNS TABLE(modelo JSONB,versiones JSONB,decisiones JSONB,total_dataset BIGINT)
LANGUAGE sql AS $$
 SELECT
  (SELECT to_jsonb(v) FROM tb_version_modelo_ia v WHERE v.tb_proyecto_id=p_proyecto_id AND v.sn_activo ORDER BY v.fecha_entrenamiento DESC LIMIT 1),
  COALESCE((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.fecha_entrenamiento DESC) FROM (SELECT * FROM tb_version_modelo_ia WHERE tb_proyecto_id=p_proyecto_id ORDER BY fecha_entrenamiento DESC LIMIT 10)v),'[]'::jsonb),
  COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.fecha_hora DESC) FROM (SELECT * FROM tb_decision_ia WHERE tb_proyecto_id=p_proyecto_id ORDER BY fecha_hora DESC LIMIT 10)d),'[]'::jsonb),
  (SELECT count(*) FROM fn_obtener_dataset_ia(p_proyecto_id,10000));
$$;
