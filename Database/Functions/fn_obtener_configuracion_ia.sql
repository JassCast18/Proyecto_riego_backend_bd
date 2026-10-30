CREATE OR REPLACE FUNCTION fn_obtener_configuracion_ia(p_proyecto_id INT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE c tb_configuracion_ia%ROWTYPE;v_modelo tb_version_modelo_ia%ROWTYPE;v_feedback INT;v_dataset INT;v_contextos INT;v_actuadores INT;v_ultima_telemetria TIMESTAMP;v_antiguedad_minutos DECIMAL;
BEGIN
 INSERT INTO tb_configuracion_ia(tb_proyecto_id) VALUES(p_proyecto_id) ON CONFLICT DO NOTHING;
 SELECT * INTO c FROM tb_configuracion_ia WHERE tb_proyecto_id=p_proyecto_id;
 SELECT * INTO v_modelo FROM tb_version_modelo_ia WHERE tb_proyecto_id=p_proyecto_id AND sn_activo ORDER BY fecha_entrenamiento DESC LIMIT 1;
 SELECT count(*) INTO v_feedback FROM tb_decision_ia WHERE tb_proyecto_id=p_proyecto_id AND tb_version_modelo_id=v_modelo.id AND estado IN('ACEPTADA','RECHAZADA','COMPLETADA');
 SELECT LEAST(count(*),10000) INTO v_dataset
 FROM tb_telemetria t JOIN tb_sensor s ON s.id=t.tb_sensor_id
 JOIN tb_nodo_iot n ON n.id=s.tb_nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
 WHERE f.tb_proyecto_id=p_proyecto_id
   AND (s.tipo_componente ILIKE '%higr%' OR s.tipo_componente ILIKE '%humedad_suelo%')
   AND pc.humedad_suelo_minima IS NOT NULL AND pc.humedad_suelo_maxima IS NOT NULL;
 SELECT count(*) INTO v_contextos FROM fn_obtener_contextos_ia(p_proyecto_id);
 SELECT MAX(t.fecha_hora) INTO v_ultima_telemetria
 FROM tb_telemetria t JOIN tb_sensor s ON s.id=t.tb_sensor_id
 JOIN tb_nodo_iot n ON n.id=s.tb_nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 WHERE f.tb_proyecto_id=p_proyecto_id AND s.sn_activo AND COALESCE(s.estado_operativo,'OPERATIVO')='OPERATIVO'
   AND (s.tipo_componente ILIKE '%higr%' OR s.tipo_componente ILIKE '%humedad_suelo%');
 v_antiguedad_minutos:=CASE WHEN v_ultima_telemetria IS NULL THEN NULL ELSE ROUND(EXTRACT(EPOCH FROM(CURRENT_TIMESTAMP-v_ultima_telemetria))/60.0,1) END;
 SELECT count(*) INTO v_actuadores FROM fn_listar_actuadores_ia(p_proyecto_id);
 RETURN jsonb_build_object('estrategia',c.estrategia_decision,'modo',c.modo,'intervaloMinutos',c.intervalo_evaluacion_minutos,'duracionSegundos',c.duracion_riego_segundos,
  'confianzaMinima',c.confianza_minima,'telemetriaMaximaMinutos',c.telemetria_maxima_minutos,
  'exactitudMinima',c.exactitud_minima,'confirmacionesMinimas',c.confirmaciones_minimas,'ultimaEvaluacion',c.ultima_evaluacion,
  'preparacion',jsonb_build_object('modeloActivo',v_modelo.id IS NOT NULL,'estadoModelo',v_modelo.estado,'exactitudActual',v_modelo.exactitud,'exactitudCumple',COALESCE(v_modelo.exactitud>=c.exactitud_minima,FALSE),
  'feedback',v_feedback,'feedbackCumple',v_feedback>=c.confirmaciones_minimas,'dataset',v_dataset,'datasetCumple',v_dataset>=50,
  'contextos',v_contextos,'telemetriaCumple',v_contextos>0,'ultimaTelemetria',v_ultima_telemetria,'antiguedadMinutos',v_antiguedad_minutos,
  'telemetriaMaximaMinutos',c.telemetria_maxima_minutos,'actuadores',v_actuadores,'actuadoresCumple',v_actuadores>0));
END;$$;
