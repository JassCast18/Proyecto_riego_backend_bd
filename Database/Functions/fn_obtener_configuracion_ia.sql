CREATE OR REPLACE FUNCTION fn_obtener_configuracion_ia(p_proyecto_id INT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE c tb_configuracion_ia%ROWTYPE;v_modelo tb_version_modelo_ia%ROWTYPE;v_feedback INT;v_dataset INT;v_contextos INT;v_actuadores INT;
BEGIN
 INSERT INTO tb_configuracion_ia(tb_proyecto_id) VALUES(p_proyecto_id) ON CONFLICT DO NOTHING;
 SELECT * INTO c FROM tb_configuracion_ia WHERE tb_proyecto_id=p_proyecto_id;
 SELECT * INTO v_modelo FROM tb_version_modelo_ia WHERE tb_proyecto_id=p_proyecto_id AND sn_activo ORDER BY fecha_entrenamiento DESC LIMIT 1;
 SELECT count(*) INTO v_feedback FROM tb_decision_ia WHERE tb_proyecto_id=p_proyecto_id AND tb_version_modelo_id=v_modelo.id AND estado IN('ACEPTADA','RECHAZADA','COMPLETADA');
 SELECT count(*) INTO v_dataset FROM fn_obtener_dataset_ia(p_proyecto_id,10000);
 SELECT count(*) INTO v_contextos FROM fn_obtener_contextos_ia(p_proyecto_id);
 SELECT count(*) INTO v_actuadores FROM fn_listar_actuadores_ia(p_proyecto_id);
 RETURN jsonb_build_object('estrategia',c.estrategia_decision,'modo',c.modo,'intervaloMinutos',c.intervalo_evaluacion_minutos,'duracionSegundos',c.duracion_riego_segundos,
  'exactitudMinima',c.exactitud_minima,'confirmacionesMinimas',c.confirmaciones_minimas,'ultimaEvaluacion',c.ultima_evaluacion,
  'preparacion',jsonb_build_object('modeloActivo',v_modelo.id IS NOT NULL,'estadoModelo',v_modelo.estado,'exactitudActual',v_modelo.exactitud,'exactitudCumple',COALESCE(v_modelo.exactitud>=c.exactitud_minima,FALSE),
  'feedback',v_feedback,'feedbackCumple',v_feedback>=c.confirmaciones_minimas,'dataset',v_dataset,'datasetCumple',v_dataset>=50,
  'contextos',v_contextos,'telemetriaCumple',v_contextos>0,'actuadores',v_actuadores,'actuadoresCumple',v_actuadores>0));
END;$$;
