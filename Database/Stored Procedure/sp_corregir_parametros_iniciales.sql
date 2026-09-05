CREATE OR REPLACE PROCEDURE sp_corregir_parametros_iniciales(
 IN p_proyecto_id INT,IN p_usuario_id INT,IN p_cultivo_id INT,IN p_variedad VARCHAR,IN p_fecha_siembra DATE,
 IN p_cosecha_dias INT,IN p_humedad_min DECIMAL,IN p_humedad_max DECIMAL,IN p_temperatura_min DECIMAL,
 IN p_temperatura_max DECIMAL,IN p_observaciones VARCHAR,IN p_motivo VARCHAR)
LANGUAGE plpgsql AS $$
DECLARE v_anterior JSONB;v_nuevo JSONB;
BEGIN
 IF length(trim(COALESCE(p_motivo,'')))<10 THEN RAISE EXCEPTION 'Debes indicar un motivo de al menos 10 caracteres.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM tb_cultivo WHERE id=p_cultivo_id) THEN RAISE EXCEPTION 'El cultivo seleccionado no existe.'; END IF;
 IF p_cosecha_dias IS NOT NULL AND p_cosecha_dias NOT BETWEEN 1 AND 3650 THEN RAISE EXCEPTION 'El tiempo de cosecha no es válido.'; END IF;
 IF p_humedad_min IS NOT NULL AND p_humedad_max IS NOT NULL AND p_humedad_min>p_humedad_max THEN RAISE EXCEPTION 'La humedad mínima no puede superar la máxima.'; END IF;
 IF p_temperatura_min IS NOT NULL AND p_temperatura_max IS NOT NULL AND p_temperatura_min>p_temperatura_max THEN RAISE EXCEPTION 'La temperatura mínima no puede superar la máxima.'; END IF;
 SELECT jsonb_build_object('cultivo_id',tb_cultivo_id,'variedad',variedad,'fecha_siembra',fecha_siembra,'tiempo_cosecha_dias',tiempo_cosecha_dias,
  'humedad_minima',humedad_suelo_minima,'humedad_maxima',humedad_suelo_maxima,'temperatura_minima',temperatura_minima,'temperatura_maxima',temperatura_maxima,'observaciones',observaciones)
 INTO v_anterior FROM tb_proyecto_cultivo WHERE tb_proyecto_id=p_proyecto_id FOR UPDATE;
 IF v_anterior IS NULL THEN RAISE EXCEPTION 'El proyecto no tiene parámetros iniciales para corregir.'; END IF;
 v_nuevo:=jsonb_build_object('cultivo_id',p_cultivo_id,'variedad',NULLIF(trim(p_variedad),''),'fecha_siembra',p_fecha_siembra,'tiempo_cosecha_dias',p_cosecha_dias,
  'humedad_minima',p_humedad_min,'humedad_maxima',p_humedad_max,'temperatura_minima',p_temperatura_min,'temperatura_maxima',p_temperatura_max,'observaciones',NULLIF(trim(p_observaciones),''));
 UPDATE tb_proyecto_cultivo SET tb_cultivo_id=p_cultivo_id,variedad=NULLIF(trim(p_variedad),''),fecha_siembra=p_fecha_siembra,tiempo_cosecha_dias=p_cosecha_dias,
  humedad_suelo_minima=p_humedad_min,humedad_suelo_maxima=p_humedad_max,temperatura_minima=p_temperatura_min,temperatura_maxima=p_temperatura_max,
  observaciones=NULLIF(trim(p_observaciones),''),cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW() WHERE tb_proyecto_id=p_proyecto_id;
 UPDATE tb_ciclo_cultivo SET tb_cultivo_id=p_cultivo_id,variedad=NULLIF(trim(p_variedad),''),fecha_inicio=p_fecha_siembra,tiempo_cosecha_estimado_dias=p_cosecha_dias
 WHERE tb_proyecto_id=p_proyecto_id AND estado='ACTIVO';
 INSERT INTO tb_historial_parametrizacion_cultivo(tb_proyecto_id,tipo_evento,origen,valores_anteriores,valores_nuevos,motivo,cod_usuario_registro)
 VALUES(p_proyecto_id,'Corrección administrativa','Usuario',v_anterior,v_nuevo,trim(p_motivo),p_usuario_id);
 UPDATE tb_version_modelo_ia SET estado='EN_REVISION' WHERE tb_proyecto_id=p_proyecto_id AND sn_activo;
 UPDATE tb_configuracion_ia SET modo='SUPERVISADO',cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW() WHERE tb_proyecto_id=p_proyecto_id;
 INSERT INTO tb_bitacora_auditoria(accion_realizada,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_anteriores,valores_nuevos,tb_usuario_id)
 VALUES('Parámetros iniciales corregidos',p_proyecto_id,'PARAMETRIZACION','USUARIO','tb_proyecto_cultivo',p_proyecto_id,trim(p_motivo),v_anterior,v_nuevo,p_usuario_id);
END;$$;
