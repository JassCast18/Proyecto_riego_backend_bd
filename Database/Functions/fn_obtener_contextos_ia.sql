DROP FUNCTION IF EXISTS fn_obtener_contextos_ia(INT);
CREATE OR REPLACE FUNCTION fn_obtener_contextos_ia(p_proyecto_id INT)
RETURNS TABLE(nodo_id INT,nodo VARCHAR,fecha_telemetria TIMESTAMP,antiguedad_minutos DECIMAL,humedad DECIMAL,temperatura DECIMAL,temperatura_ambiente DECIMAL,humedad_ambiente DECIMAL,presion_atmosferica DECIMAL,hora INT,dias_cultivo INT,humedad_minima DECIMAL,humedad_maxima DECIMAL,salud_foliar DECIMAL)
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
     AND (sh.tipo_componente ILIKE '%higr%' OR sh.tipo_componente ILIKE '%humedad_suelo%')
   ORDER BY n.id,t.fecha_hora DESC
 )
 SELECT h.nodo_id,h.nodo,h.fecha_hora,
   ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-h.fecha_hora))/60.0,1),
   LEAST(100,GREATEST(0,CASE WHEN h.adc_seco IS NOT NULL AND h.adc_humedo IS NOT NULL AND h.adc_seco<>h.adc_humedo
     THEN (h.adc_seco-h.valor_lectura)*100/(h.adc_seco-h.adc_humedo) ELSE (1023-h.valor_lectura)*100/1023 END)),
   COALESCE(temp.valor_lectura,20),COALESCE(temp_amb.valor_lectura,20),
   COALESCE(hum_amb.valor_lectura,60),COALESCE(presion.valor_lectura,1013.25),
   EXTRACT(HOUR FROM h.fecha_hora)::INT,
   GREATEST(0,(h.fecha_hora::DATE-COALESCE(cc.fecha_inicio,pc.fecha_siembra,h.fecha_hora::DATE)))::INT,
   pc.humedad_suelo_minima,pc.humedad_suelo_maxima,
   COALESCE((fn_obtener_resumen_foliar_ia(p_proyecto_id)->>'promedioReciente')::DECIMAL,85)
 FROM humedad_reciente h
 JOIN tb_nodo_iot n ON n.id=h.nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
 LEFT JOIN tb_ciclo_cultivo cc ON cc.tb_proyecto_id=f.tb_proyecto_id AND cc.estado='ACTIVO'
 LEFT JOIN LATERAL(SELECT t.valor_lectura FROM tb_telemetria t JOIN tb_sensor st ON st.id=t.tb_sensor_id
   WHERE st.tb_nodo_id=h.nodo_id AND st.tipo_componente ILIKE '%term%'
   ORDER BY ABS(EXTRACT(EPOCH FROM(t.fecha_hora-h.fecha_hora))) LIMIT 1)temp ON TRUE
 LEFT JOIN LATERAL(SELECT t.valor_lectura FROM tb_telemetria t JOIN tb_sensor st ON st.id=t.tb_sensor_id JOIN tb_nodo_iot gn ON gn.id=st.tb_nodo_id JOIN tb_sector gs ON gs.id=gn.tb_sector_id JOIN tb_finca gf ON gf.id=gs.tb_finca_id
   WHERE gf.tb_proyecto_id=p_proyecto_id AND st.tipo_componente='BME280_TEMPERATURA_AMBIENTE'
     AND t.fecha_hora BETWEEN h.fecha_hora-INTERVAL '30 minutes' AND h.fecha_hora+INTERVAL '30 minutes'
   ORDER BY ABS(EXTRACT(EPOCH FROM(t.fecha_hora-h.fecha_hora))) LIMIT 1)temp_amb ON TRUE
 LEFT JOIN LATERAL(SELECT t.valor_lectura FROM tb_telemetria t JOIN tb_sensor st ON st.id=t.tb_sensor_id JOIN tb_nodo_iot gn ON gn.id=st.tb_nodo_id JOIN tb_sector gs ON gs.id=gn.tb_sector_id JOIN tb_finca gf ON gf.id=gs.tb_finca_id
   WHERE gf.tb_proyecto_id=p_proyecto_id AND st.tipo_componente='BME280_HUMEDAD_RELATIVA'
     AND t.fecha_hora BETWEEN h.fecha_hora-INTERVAL '30 minutes' AND h.fecha_hora+INTERVAL '30 minutes'
   ORDER BY ABS(EXTRACT(EPOCH FROM(t.fecha_hora-h.fecha_hora))) LIMIT 1)hum_amb ON TRUE
 LEFT JOIN LATERAL(SELECT t.valor_lectura FROM tb_telemetria t JOIN tb_sensor st ON st.id=t.tb_sensor_id JOIN tb_nodo_iot gn ON gn.id=st.tb_nodo_id JOIN tb_sector gs ON gs.id=gn.tb_sector_id JOIN tb_finca gf ON gf.id=gs.tb_finca_id
   WHERE gf.tb_proyecto_id=p_proyecto_id AND st.tipo_componente='BME280_PRESION_ATMOSFERICA'
     AND t.fecha_hora BETWEEN h.fecha_hora-INTERVAL '30 minutes' AND h.fecha_hora+INTERVAL '30 minutes'
   ORDER BY ABS(EXTRACT(EPOCH FROM(t.fecha_hora-h.fecha_hora))) LIMIT 1)presion ON TRUE
 WHERE pc.humedad_suelo_minima IS NOT NULL AND pc.humedad_suelo_maxima IS NOT NULL
   AND n.estado_energia='ENCENDIDO'
   AND h.fecha_hora >= CURRENT_TIMESTAMP-make_interval(mins=>COALESCE((SELECT telemetria_maxima_minutos FROM tb_configuracion_ia WHERE tb_proyecto_id=p_proyecto_id),30));
$$;
