CREATE OR REPLACE PROCEDURE sp_resolver_decision_ia(IN p_decision_id BIGINT,IN p_proyecto_id INT,IN p_usuario_id INT,IN p_accion VARCHAR,IN p_actuador_id INT,IN p_duracion_segundos INT,IN p_observacion VARCHAR)
LANGUAGE plpgsql AS $$
DECLARE v_decision tb_decision_ia%ROWTYPE;v_pin INT;v_low BOOLEAN;v_max INT;v_sensor INT;v_humedad DECIMAL;v_ciclo_id BIGINT;
BEGIN
 PERFORM pg_advisory_xact_lock(4100,COALESCE((SELECT tb_nodo_id FROM tb_decision_ia WHERE id=p_decision_id),0));
 SELECT * INTO v_decision FROM tb_decision_ia WHERE id=p_decision_id AND tb_proyecto_id=p_proyecto_id FOR UPDATE;
 IF v_decision.id IS NULL THEN RAISE EXCEPTION 'La recomendación no existe.'; END IF;
 IF v_decision.estado<>'PENDIENTE' THEN RAISE EXCEPTION 'La recomendación ya fue resuelta.'; END IF;
 IF upper(p_accion)='RECHAZAR' THEN
   IF length(trim(COALESCE(p_observacion,'')))<5 THEN RAISE EXCEPTION 'Explica por qué rechazas la recomendación.'; END IF;
   IF v_decision.decision='REGAR' THEN
     UPDATE tb_decision_ia SET estado='RECHAZADA',tb_usuario_resuelve_id=p_usuario_id,observacion_resolucion=trim(p_observacion),fecha_resolucion=NOW() WHERE id=p_decision_id;
     INSERT INTO tb_bitacora_auditoria(accion_realizada,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,tb_usuario_id)
     VALUES('Recomendación de IA rechazada',p_proyecto_id,'IA','USUARIO','tb_decision_ia',p_decision_id,trim(p_observacion),p_usuario_id);
     UPDATE tb_version_modelo_ia m SET estado='VALIDADO' WHERE m.id=v_decision.tb_version_modelo_id AND
       (SELECT count(*) FROM tb_decision_ia d WHERE d.tb_version_modelo_id=m.id AND d.estado IN('ACEPTADA','RECHAZADA','COMPLETADA')) >=
       (SELECT confirmaciones_minimas FROM tb_configuracion_ia WHERE tb_proyecto_id=p_proyecto_id);
     RETURN;
   END IF;
 END IF;
 IF upper(p_accion) NOT IN('ACEPTAR','RECHAZAR') THEN RAISE EXCEPTION 'Acción no válida.'; END IF;
 IF v_decision.decision='NO_REGAR' AND upper(p_accion)='ACEPTAR' THEN
   UPDATE tb_decision_ia SET estado='ACEPTADA',ejecutada=FALSE,tb_usuario_resuelve_id=p_usuario_id,
     observacion_resolucion=NULLIF(trim(COALESCE(p_observacion,'')),''),fecha_resolucion=NOW()
   WHERE id=p_decision_id;
   INSERT INTO tb_bitacora_auditoria(accion_realizada,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,tb_usuario_id)
   VALUES('Recomendación de no regar aceptada',p_proyecto_id,'IA',CASE WHEN p_usuario_id IS NULL THEN 'SISTEMA' ELSE 'USUARIO' END,
     'tb_decision_ia',p_decision_id,'Se confirmó la recomendación de no activar el riego.',p_usuario_id);
   UPDATE tb_version_modelo_ia m SET estado='VALIDADO' WHERE m.id=v_decision.tb_version_modelo_id AND
     (SELECT count(*) FROM tb_decision_ia d WHERE d.tb_version_modelo_id=m.id AND d.estado IN('ACEPTADA','RECHAZADA','COMPLETADA')) >=
     (SELECT confirmaciones_minimas FROM tb_configuracion_ia WHERE tb_proyecto_id=p_proyecto_id);
   RETURN;
 END IF;
 CALL sp_sincronizar_ciclos_riego(p_proyecto_id,v_decision.tb_nodo_id);
 SELECT na.pin_control,a.activo_en_low,a.duracion_maxima_segundos INTO v_pin,v_low,v_max
 FROM tb_nodo_actuador na JOIN tb_actuador a ON a.id=na.tb_actuador_id
 WHERE na.tb_nodo_id=v_decision.tb_nodo_id AND a.id=p_actuador_id AND na.sn_activo AND a.sn_activo AND a.tb_proyecto_id=p_proyecto_id;
 IF v_pin IS NULL THEN RAISE EXCEPTION 'El actuador no pertenece al nodo recomendado.'; END IF;
 IF p_duracion_segundos NOT BETWEEN 10 AND v_max THEN RAISE EXCEPTION 'La duración debe estar entre 10 y % segundos.',v_max; END IF;
 IF EXISTS(SELECT 1 FROM tb_ciclo_riego WHERE tb_nodo_id=v_decision.tb_nodo_id AND estado='ACTIVO') THEN RAISE EXCEPTION 'El nodo ya tiene un riego activo.'; END IF;
 IF EXISTS(SELECT 1 FROM tb_prueba_unitaria WHERE tb_nodo_id=v_decision.tb_nodo_id AND estado IN('ESPERANDO','EN_CURSO','DETENIENDO')) THEN RAISE EXCEPTION 'El nodo tiene una prueba técnica activa.'; END IF;
 SELECT id INTO v_sensor FROM tb_sensor WHERE tb_nodo_id=v_decision.tb_nodo_id AND sn_activo AND estado_operativo='OPERATIVO' AND (tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%hum%') ORDER BY id LIMIT 1;
 IF v_sensor IS NULL THEN RAISE EXCEPTION 'El nodo no tiene un sensor de humedad operativo.'; END IF;
 v_humedad:=NULLIF(v_decision.variables_entrada->>'humedad','')::DECIMAL;
 INSERT INTO tb_ciclo_riego(tb_proyecto_id,tb_nodo_id,tb_sensor_id,tb_actuador_id,humedad_inicio,tb_decision_ia_id)
 VALUES(p_proyecto_id,v_decision.tb_nodo_id,v_sensor,p_actuador_id,v_humedad,p_decision_id) RETURNING id INTO v_ciclo_id;
 INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tipo_comando,payload,fecha_expiracion) VALUES
 (p_proyecto_id,v_decision.tb_nodo_id,'CONFIGURAR_INTERVALO',jsonb_build_object('intervaloSegundos',10),NOW()+INTERVAL '5 minutes'),
 (p_proyecto_id,v_decision.tb_nodo_id,'ACTIVAR_ACTUADOR',jsonb_build_object('pruebaId',0,'componenteId',p_actuador_id,'pin',v_pin,'activoEnLow',v_low,'duracionSegundos',p_duracion_segundos),NOW()+INTERVAL '5 minutes');
 UPDATE tb_decision_ia SET estado=CASE WHEN upper(p_accion)='RECHAZAR' THEN 'RECHAZADA' ELSE 'ACEPTADA' END,
   ejecutada=TRUE,tb_usuario_resuelve_id=p_usuario_id,tb_actuador_id=p_actuador_id,duracion_segundos=p_duracion_segundos,
   observacion_resolucion=NULLIF(trim(COALESCE(p_observacion,'')),''),fecha_resolucion=NOW() WHERE id=p_decision_id;
 INSERT INTO tb_bitacora_auditoria(accion_realizada,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_nuevos,tb_usuario_id)
 VALUES(CASE WHEN upper(p_accion)='RECHAZAR' THEN 'Recomendación de no regar rechazada' ELSE 'Riego recomendado por IA aceptado' END,
   p_proyecto_id,'IA','USUARIO','tb_decision_ia',p_decision_id,
   CASE WHEN upper(p_accion)='RECHAZAR' THEN 'El usuario rechazó no regar e inició el riego.' ELSE 'El usuario confirmó el riego recomendado.' END,
   jsonb_build_object('actuador_id',p_actuador_id,'duracion_segundos',p_duracion_segundos,'ciclo_riego_id',v_ciclo_id),p_usuario_id);
 INSERT INTO tb_notificacion(clave_evento,tb_proyecto_id,tb_nodo_id,categoria,tipo,titulo,mensaje,severidad,estado,descartable)
 VALUES('IA:RIEGO:ACEPTADO:'||p_decision_id,p_proyecto_id,v_decision.tb_nodo_id,'IA','IA_RIEGO_ACEPTADO','Riego confirmado',
   CASE WHEN upper(p_accion)='RECHAZAR' THEN 'Se rechazó la recomendación de no regar. El gateway recibirá la orden de riego.' ELSE 'La recomendación fue aceptada. El gateway recibirá la orden de riego.' END,
   'INFO','ACTIVA',TRUE);
 UPDATE tb_version_modelo_ia m SET estado='VALIDADO' WHERE m.id=v_decision.tb_version_modelo_id AND
   (SELECT count(*) FROM tb_decision_ia d WHERE d.tb_version_modelo_id=m.id AND d.estado IN('ACEPTADA','RECHAZADA','COMPLETADA')) >=
   (SELECT confirmaciones_minimas FROM tb_configuracion_ia WHERE tb_proyecto_id=p_proyecto_id);
END; $$;
