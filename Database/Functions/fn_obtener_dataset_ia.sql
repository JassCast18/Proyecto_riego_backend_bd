CREATE OR REPLACE FUNCTION fn_obtener_dataset_ia(p_proyecto_id INT,p_limite INT DEFAULT 5000)
RETURNS TABLE(humedad DECIMAL,temperatura DECIMAL,hora INT,dias_cultivo INT,humedad_minima DECIMAL,humedad_maxima DECIMAL,decision VARCHAR)
LANGUAGE sql AS $$
 SELECT LEAST(100,GREATEST(0,CASE WHEN sh.adc_seco IS NOT NULL AND sh.adc_humedo IS NOT NULL AND sh.adc_seco<>sh.adc_humedo
          THEN (sh.adc_seco-th.valor_lectura)*100/(sh.adc_seco-sh.adc_humedo)
          ELSE (1023-th.valor_lectura)*100/1023 END)),
        COALESCE(temp.valor_lectura,20),EXTRACT(HOUR FROM th.fecha_hora)::INT,
        GREATEST(0,(th.fecha_hora::DATE-COALESCE(cc.fecha_inicio,pc.fecha_siembra,th.fecha_hora::DATE)))::INT,
        pc.humedad_suelo_minima,pc.humedad_suelo_maxima,
        CASE WHEN LEAST(100,GREATEST(0,CASE WHEN sh.adc_seco IS NOT NULL AND sh.adc_humedo IS NOT NULL AND sh.adc_seco<>sh.adc_humedo
          THEN (sh.adc_seco-th.valor_lectura)*100/(sh.adc_seco-sh.adc_humedo) ELSE (1023-th.valor_lectura)*100/1023 END))<pc.humedad_suelo_minima THEN 'REGAR' ELSE 'NO_REGAR' END::VARCHAR
 FROM tb_telemetria th JOIN tb_sensor sh ON sh.id=th.tb_sensor_id
 JOIN tb_nodo_iot n ON n.id=sh.tb_nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
 LEFT JOIN tb_ciclo_cultivo cc ON cc.tb_proyecto_id=f.tb_proyecto_id AND cc.estado='ACTIVO'
 LEFT JOIN LATERAL(SELECT t.valor_lectura FROM tb_telemetria t JOIN tb_sensor st ON st.id=t.tb_sensor_id WHERE st.tb_nodo_id=n.id AND st.tipo_componente ILIKE '%term%' AND t.fecha_hora BETWEEN th.fecha_hora-INTERVAL '5 minutes' AND th.fecha_hora+INTERVAL '5 minutes' ORDER BY ABS(EXTRACT(EPOCH FROM(t.fecha_hora-th.fecha_hora))) LIMIT 1)temp ON TRUE
 WHERE f.tb_proyecto_id=p_proyecto_id AND (sh.tipo_componente ILIKE '%higr%' OR sh.tipo_componente ILIKE '%hum%')
   AND sh.sn_activo AND sh.estado_operativo='OPERATIVO'
   AND pc.humedad_suelo_minima IS NOT NULL AND pc.humedad_suelo_maxima IS NOT NULL
 ORDER BY th.fecha_hora DESC LIMIT LEAST(GREATEST(p_limite,20),10000);
$$;
