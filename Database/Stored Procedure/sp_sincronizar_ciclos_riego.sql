CREATE OR REPLACE PROCEDURE sp_sincronizar_ciclos_riego(IN p_proyecto_id INT DEFAULT NULL,IN p_nodo_id INT DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE v_ciclo RECORD;v_limite INT;
BEGIN
 FOR v_ciclo IN
   SELECT c.*,a.estado_actual,a.duracion_maxima_segundos,d.duracion_segundos
   FROM tb_ciclo_riego c JOIN tb_actuador a ON a.id=c.tb_actuador_id
   LEFT JOIN tb_decision_ia d ON d.id=c.tb_decision_ia_id
   WHERE c.estado='ACTIVO' AND (p_proyecto_id IS NULL OR c.tb_proyecto_id=p_proyecto_id) AND (p_nodo_id IS NULL OR c.tb_nodo_id=p_nodo_id)
 LOOP
   v_limite:=COALESCE(v_ciclo.duracion_segundos,v_ciclo.duracion_maxima_segundos,60);
   IF v_ciclo.fecha_inicio+make_interval(secs=>v_limite)<=NOW() THEN
     UPDATE tb_ciclo_riego SET estado='FINALIZADO',fecha_fin=NOW(),motivo_cierre='Límite de seguridad alcanzado; ciclo sincronizado por el backend' WHERE id=v_ciclo.id;
     UPDATE tb_actuador SET estado_actual='INACTIVO' WHERE id=v_ciclo.tb_actuador_id;
     UPDATE tb_decision_ia SET estado='COMPLETADA' WHERE id=v_ciclo.tb_decision_ia_id AND estado='ACEPTADA';
     IF v_ciclo.estado_actual<>'INACTIVO' THEN
       INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tipo_comando,payload,fecha_expiracion)
       VALUES(v_ciclo.tb_proyecto_id,v_ciclo.tb_nodo_id,'DESACTIVAR_ACTUADOR',jsonb_build_object('pruebaId',0,'componenteId',v_ciclo.tb_actuador_id),NOW()+INTERVAL '5 minutes');
     END IF;
     INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tipo_comando,payload,fecha_expiracion)
     VALUES(v_ciclo.tb_proyecto_id,v_ciclo.tb_nodo_id,'RESTAURAR_INTERVALO',jsonb_build_object('intervaloSegundos',30),NOW()+INTERVAL '5 minutes');
     INSERT INTO tb_bitacora_auditoria(accion_realizada,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_nuevos)
     VALUES('Ciclo de riego vencido sincronizado',v_ciclo.tb_proyecto_id,'RIEGO','SISTEMA','tb_ciclo_riego',v_ciclo.id,'El backend cerró un ciclo cuyo tiempo máximo ya había finalizado.',jsonb_build_object('duracion_limite',v_limite,'actuador_id',v_ciclo.tb_actuador_id));
   END IF;
 END LOOP;
END;$$;
