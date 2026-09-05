DROP PROCEDURE IF EXISTS sp_configurar_ia(INT,INT,VARCHAR,INT,INT,DECIMAL,INT);
CREATE OR REPLACE PROCEDURE sp_configurar_ia(IN p_proyecto_id INT,IN p_usuario_id INT,IN p_estrategia VARCHAR,IN p_modo VARCHAR,IN p_intervalo INT,IN p_duracion INT,IN p_exactitud DECIMAL,IN p_confirmaciones INT)
LANGUAGE plpgsql AS $$
DECLARE v_ready JSONB;v_modo VARCHAR:=upper(trim(p_modo));v_estrategia VARCHAR:=upper(trim(p_estrategia));
BEGIN
 IF v_estrategia NOT IN('UMBRAL','IA') THEN RAISE EXCEPTION 'Motor de decisión no válido.'; END IF;
 IF v_modo NOT IN('SUPERVISADO','AUTOMATICO') THEN RAISE EXCEPTION 'Modo de IA no válido.'; END IF;
 IF p_intervalo NOT BETWEEN 1 AND 60 OR p_duracion NOT BETWEEN 10 AND 600 OR p_exactitud NOT BETWEEN .50 AND 1 OR p_confirmaciones NOT BETWEEN 3 AND 100 THEN RAISE EXCEPTION 'La configuración de IA contiene valores fuera de rango.'; END IF;
 INSERT INTO tb_configuracion_ia(tb_proyecto_id) VALUES(p_proyecto_id) ON CONFLICT DO NOTHING;
 CALL sp_sincronizar_ciclos_riego(p_proyecto_id,NULL);
 IF EXISTS(SELECT 1 FROM tb_ciclo_riego WHERE tb_proyecto_id=p_proyecto_id AND estado='ACTIVO') OR EXISTS(SELECT 1 FROM tb_prueba_unitaria WHERE tb_proyecto_id=p_proyecto_id AND estado IN('ESPERANDO','EN_CURSO','DETENIENDO')) THEN RAISE EXCEPTION 'No puedes cambiar el motor durante un riego o una prueba activa.'; END IF;
 UPDATE tb_configuracion_ia SET intervalo_evaluacion_minutos=p_intervalo,duracion_riego_segundos=p_duracion,exactitud_minima=p_exactitud,confirmaciones_minimas=p_confirmaciones,cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW() WHERE tb_proyecto_id=p_proyecto_id;
 v_ready:=fn_obtener_configuracion_ia(p_proyecto_id)->'preparacion';
 IF v_estrategia='IA' AND v_modo='AUTOMATICO' AND NOT ((v_ready->>'modeloActivo')::BOOLEAN AND (v_ready->>'exactitudCumple')::BOOLEAN AND (v_ready->>'feedbackCumple')::BOOLEAN AND (v_ready->>'datasetCumple')::BOOLEAN AND (v_ready->>'telemetriaCumple')::BOOLEAN AND (v_ready->>'actuadoresCumple')::BOOLEAN) THEN
   RAISE EXCEPTION 'El proyecto todavía no cumple todas las condiciones para activar el modo automático.';
 END IF;
 UPDATE tb_configuracion_ia SET estrategia_decision=v_estrategia,modo=CASE WHEN v_estrategia='UMBRAL' THEN 'SUPERVISADO' ELSE v_modo END WHERE tb_proyecto_id=p_proyecto_id;
 INSERT INTO tb_bitacora_auditoria(accion_realizada,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,tb_usuario_id)
 VALUES('Motor de decisión actualizado',p_proyecto_id,'IA','USUARIO','tb_configuracion_ia',p_proyecto_id,'Motor '||v_estrategia||', modo '||v_modo||', evaluación cada '||p_intervalo||' minutos.',p_usuario_id);
END;$$;
