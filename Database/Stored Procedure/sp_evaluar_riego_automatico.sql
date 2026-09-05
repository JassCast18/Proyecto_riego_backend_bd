CREATE OR REPLACE PROCEDURE sp_evaluar_riego_automatico(p_nodo_id INT,p_humedad_raw DECIMAL)
LANGUAGE plpgsql AS $$
DECLARE
 v_proyecto INT;v_sensor INT;v_actuador INT;v_pin INT;v_low BOOLEAN;v_max_duracion INT;
 v_min DECIMAL;v_max DECIMAL;v_seco DECIMAL;v_humedo DECIMAL;v_porcentaje DECIMAL;v_ciclo tb_ciclo_riego%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(4100,p_nodo_id);
 SELECT f.tb_proyecto_id,s.id,s.adc_seco,s.adc_humedo,pc.humedad_suelo_minima,pc.humedad_suelo_maxima
 INTO v_proyecto,v_sensor,v_seco,v_humedo,v_min,v_max
 FROM tb_nodo_iot n JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 JOIN tb_sensor s ON s.tb_nodo_id=n.id AND (s.tipo_componente ILIKE '%higr%' OR s.tipo_componente ILIKE '%hum%')
 JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
 WHERE n.id=p_nodo_id AND n.estado_energia='ENCENDIDO' AND s.sn_activo AND s.estado_operativo='OPERATIVO'
 ORDER BY pc.id DESC LIMIT 1;
 IF v_sensor IS NULL OR v_min IS NULL OR v_max IS NULL THEN RETURN; END IF;
 v_porcentaje:=CASE WHEN v_seco IS NOT NULL AND v_humedo IS NOT NULL AND v_seco<>v_humedo
   THEN LEAST(100,GREATEST(0,(v_seco-p_humedad_raw)*100/(v_seco-v_humedo)))
   ELSE LEAST(100,GREATEST(0,(1023-p_humedad_raw)*100/1023)) END;
 SELECT * INTO v_ciclo FROM tb_ciclo_riego WHERE tb_nodo_id=p_nodo_id AND estado='ACTIVO' FOR UPDATE;
 SELECT a.id,na.pin_control,a.activo_en_low,LEAST(COALESCE(d.duracion_segundos,cfg.duracion_riego_segundos,a.duracion_maxima_segundos),a.duracion_maxima_segundos) INTO v_actuador,v_pin,v_low,v_max_duracion
 FROM tb_nodo_actuador na JOIN tb_actuador a ON a.id=na.tb_actuador_id
 LEFT JOIN tb_decision_ia d ON d.id=v_ciclo.tb_decision_ia_id
 LEFT JOIN tb_configuracion_ia cfg ON cfg.tb_proyecto_id=v_proyecto
 WHERE na.tb_nodo_id=p_nodo_id AND na.sn_activo AND a.sn_activo AND (v_ciclo.id IS NULL OR a.id=v_ciclo.tb_actuador_id)
 ORDER BY na.es_principal DESC,a.id LIMIT 1;
 IF v_actuador IS NULL THEN RETURN; END IF;

 IF v_ciclo.id IS NULL AND v_porcentaje<v_min
   AND (NOT EXISTS(SELECT 1 FROM tb_configuracion_ia WHERE tb_proyecto_id=v_proyecto)
        OR EXISTS(SELECT 1 FROM tb_configuracion_ia WHERE tb_proyecto_id=v_proyecto AND estrategia_decision='UMBRAL'))
   AND NOT EXISTS(SELECT 1 FROM tb_prueba_unitaria WHERE tb_nodo_id=p_nodo_id AND estado IN('ESPERANDO','EN_CURSO','DETENIENDO'))
   AND NOT EXISTS(SELECT 1 FROM tb_ciclo_riego WHERE tb_nodo_id=p_nodo_id AND fecha_fin>NOW()-INTERVAL '30 seconds') THEN
   INSERT INTO tb_ciclo_riego(tb_proyecto_id,tb_nodo_id,tb_sensor_id,tb_actuador_id,humedad_inicio)
   VALUES(v_proyecto,p_nodo_id,v_sensor,v_actuador,v_porcentaje) RETURNING * INTO v_ciclo;
   INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tipo_comando,payload,fecha_expiracion) VALUES
    (v_proyecto,p_nodo_id,'CONFIGURAR_INTERVALO',jsonb_build_object('intervaloSegundos',10),NOW()+INTERVAL '5 minutes'),
    (v_proyecto,p_nodo_id,'ACTIVAR_ACTUADOR',jsonb_build_object('pruebaId',0,'componenteId',v_actuador,'pin',v_pin,'activoEnLow',v_low,'duracionSegundos',v_max_duracion),NOW()+INTERVAL '5 minutes');
   UPDATE tb_actuador SET estado_actual='ACTIVO' WHERE id=v_actuador;
   INSERT INTO tb_bitacora_auditoria(accion_realizada,fecha_hora,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_nuevos)
   VALUES('Riego automático iniciado',NOW(),v_proyecto,'RIEGO','SISTEMA','tb_actuador',v_actuador,'Actuador encendido por humedad bajo el mínimo.',jsonb_build_object('humedad',v_porcentaje,'minimo',v_min,'intervalo_segundos',10,'ciclo_riego_id',v_ciclo.id));
   INSERT INTO tb_notificacion(clave_evento,tb_proyecto_id,tb_nodo_id,categoria,tipo,titulo,mensaje,severidad,estado,descartable)
   VALUES('RIEGO:INICIO:'||v_ciclo.id,v_proyecto,p_nodo_id,'RIEGO','RIEGO_INICIADO','Riego automático iniciado','Actuador #'||v_actuador||' encendido con humedad '||round(v_porcentaje,1)||'%.','INFO','ACTIVA',TRUE);
 ELSIF v_ciclo.id IS NOT NULL AND (v_porcentaje>=v_max OR v_ciclo.fecha_inicio+make_interval(secs=>v_max_duracion)<=NOW()) THEN
   UPDATE tb_ciclo_riego SET estado='FINALIZADO',humedad_fin=v_porcentaje,fecha_fin=NOW(),
     motivo_cierre=CASE WHEN v_porcentaje>=v_max THEN 'Humedad máxima alcanzada' ELSE 'Límite de seguridad alcanzado' END WHERE id=v_ciclo.id;
   INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tipo_comando,payload,fecha_expiracion) VALUES
    (v_proyecto,p_nodo_id,'DESACTIVAR_ACTUADOR',jsonb_build_object('pruebaId',0,'componenteId',v_actuador),NOW()+INTERVAL '5 minutes'),
    (v_proyecto,p_nodo_id,'RESTAURAR_INTERVALO',jsonb_build_object('intervaloSegundos',30),NOW()+INTERVAL '5 minutes');
   UPDATE tb_actuador SET estado_actual='INACTIVO' WHERE id=v_actuador;
   UPDATE tb_decision_ia SET estado='COMPLETADA' WHERE id=v_ciclo.tb_decision_ia_id AND estado='ACEPTADA';
   INSERT INTO tb_bitacora_auditoria(accion_realizada,fecha_hora,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_anteriores,valores_nuevos)
   VALUES('Riego automático finalizado',NOW(),v_proyecto,'RIEGO','SISTEMA','tb_actuador',v_actuador,'Actuador apagado. '||CASE WHEN v_porcentaje>=v_max THEN 'La humedad volvió al rango.' ELSE 'Se alcanzó el límite de seguridad.' END,jsonb_build_object('humedad_inicio',v_ciclo.humedad_inicio),jsonb_build_object('humedad_fin',v_porcentaje,'maximo',v_max,'ciclo_riego_id',v_ciclo.id));
   INSERT INTO tb_notificacion(clave_evento,tb_proyecto_id,tb_nodo_id,categoria,tipo,titulo,mensaje,severidad,estado,descartable)
   VALUES('RIEGO:FIN:'||v_ciclo.id,v_proyecto,p_nodo_id,'RIEGO','RIEGO_FINALIZADO','Actuador apagado','Riego #'||v_ciclo.id||' finalizado con humedad '||round(v_porcentaje,1)||'%.','INFO','ACTIVA',TRUE);
 END IF;
END;$$;
