DROP FUNCTION IF EXISTS fn_obtener_feedback_ia_corte(INT,INT,BIGINT);
CREATE OR REPLACE FUNCTION fn_obtener_feedback_ia_corte(p_proyecto_id INT,p_limite INT,p_hasta_decision_id BIGINT)
RETURNS TABLE(humedad DECIMAL,temperatura DECIMAL,hora INT,dias_cultivo INT,humedad_minima DECIMAL,humedad_maxima DECIMAL,salud_foliar DECIMAL,decision VARCHAR)
LANGUAGE sql AS $$
 SELECT
   NULLIF(d.variables_entrada->>'humedad','')::DECIMAL,
   NULLIF(d.variables_entrada->>'temperatura','')::DECIMAL,
   NULLIF(d.variables_entrada->>'hora','')::INT,
   NULLIF(d.variables_entrada->>'dias_cultivo','')::INT,
   NULLIF(d.variables_entrada->>'humedad_minima','')::DECIMAL,
   NULLIF(d.variables_entrada->>'humedad_maxima','')::DECIMAL,
   COALESCE(NULLIF(d.variables_entrada->>'salud_foliar','')::DECIMAL,85),
   CASE WHEN d.estado IN ('ACEPTADA','COMPLETADA') THEN d.decision WHEN d.estado='RECHAZADA' AND d.decision='REGAR' THEN 'NO_REGAR' WHEN d.estado='RECHAZADA' AND d.decision='NO_REGAR' THEN 'REGAR' END::VARCHAR
 FROM tb_decision_ia d
 WHERE d.tb_proyecto_id=p_proyecto_id AND d.estado IN ('ACEPTADA','COMPLETADA','RECHAZADA')
   AND d.fecha_hora<=(SELECT corte.fecha_hora FROM tb_decision_ia corte WHERE corte.id=p_hasta_decision_id AND corte.tb_proyecto_id=p_proyecto_id)
   AND d.variables_entrada ?& ARRAY['humedad','temperatura','hora','dias_cultivo','humedad_minima','humedad_maxima']
 ORDER BY d.fecha_resolucion DESC NULLS LAST LIMIT LEAST(GREATEST(p_limite,1),5000);
$$;
