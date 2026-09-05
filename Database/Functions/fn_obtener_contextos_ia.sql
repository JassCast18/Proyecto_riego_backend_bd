CREATE OR REPLACE FUNCTION fn_obtener_contextos_ia(p_proyecto_id INT)
RETURNS TABLE(nodo_id INT,nodo VARCHAR,humedad DECIMAL,temperatura DECIMAL,hora INT,dias_cultivo INT,humedad_minima DECIMAL,humedad_maxima DECIMAL)
LANGUAGE sql AS $$
 WITH humedad_reciente AS (
   SELECT DISTINCT ON (n.id) n.id nodo_id,n.tipo_nodo nodo,sh.id sensor_id,t.valor_lectura,t.fecha_hora,
          sh.adc_seco,sh.adc_humedo
   FROM tb_nodo_iot n
   JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
   JOIN tb_sensor sh ON sh.tb_nodo_id=n.id
   JOIN tb_telemetria t ON t.tb_sensor_id=sh.id
   WHERE f.tb_proyecto_id=p_proyecto_id
     AND COALESCE(sh.estado_operativo,'OPERATIVO')='OPERATIVO'
     AND (sh.tipo_componente ILIKE '%higr%' OR sh.tipo_componente ILIKE '%hum%')
   ORDER BY n.id,t.fecha_hora DESC
 )
 SELECT h.nodo_id,h.nodo,
   LEAST(100,GREATEST(0,CASE WHEN h.adc_seco IS NOT NULL AND h.adc_humedo IS NOT NULL AND h.adc_seco<>h.adc_humedo
     THEN (h.adc_seco-h.valor_lectura)*100/(h.adc_seco-h.adc_humedo) ELSE (1023-h.valor_lectura)*100/1023 END)),
   COALESCE(temp.valor_lectura,20),EXTRACT(HOUR FROM h.fecha_hora)::INT,
   GREATEST(0,(h.fecha_hora::DATE-COALESCE(cc.fecha_inicio,pc.fecha_siembra,h.fecha_hora::DATE)))::INT,
   pc.humedad_suelo_minima,pc.humedad_suelo_maxima
 FROM humedad_reciente h
 JOIN tb_nodo_iot n ON n.id=h.nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
 LEFT JOIN tb_ciclo_cultivo cc ON cc.tb_proyecto_id=f.tb_proyecto_id AND cc.estado='ACTIVO'
 LEFT JOIN LATERAL(SELECT t.valor_lectura FROM tb_telemetria t JOIN tb_sensor st ON st.id=t.tb_sensor_id
   WHERE st.tb_nodo_id=h.nodo_id AND st.tipo_componente ILIKE '%term%'
   ORDER BY ABS(EXTRACT(EPOCH FROM(t.fecha_hora-h.fecha_hora))) LIMIT 1)temp ON TRUE
 WHERE pc.humedad_suelo_minima IS NOT NULL AND pc.humedad_suelo_maxima IS NOT NULL;
$$;
