CREATE OR REPLACE PROCEDURE sp_iniciar_ciclo_cultivo(IN p_proyecto_id INT,IN p_usuario_id INT,IN p_cultivo_id INT,IN p_variedad VARCHAR,IN p_fecha_inicio DATE,IN p_tiempo_cosecha INT)
LANGUAGE plpgsql AS $$
DECLARE v_numero INT;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND tb_rol_id=1 AND sn_activo=TRUE) THEN RAISE EXCEPTION 'Solo un administrador puede iniciar una plantación.'; END IF;
 IF EXISTS(SELECT 1 FROM tb_ciclo_cultivo WHERE tb_proyecto_id=p_proyecto_id AND estado='ACTIVO') THEN RAISE EXCEPTION 'Ya existe una plantación activa.'; END IF;
 IF p_cultivo_id IS NULL OR p_fecha_inicio IS NULL THEN RAISE EXCEPTION 'El cultivo y la fecha de siembra son obligatorios.'; END IF;
 SELECT COALESCE(MAX(numero_ciclo),0)+1 INTO v_numero FROM tb_ciclo_cultivo WHERE tb_proyecto_id=p_proyecto_id;
 INSERT INTO tb_ciclo_cultivo(tb_proyecto_id,numero_ciclo,tb_cultivo_id,variedad,fecha_inicio,tiempo_cosecha_estimado_dias,estado,cod_usuario_registro) VALUES(p_proyecto_id,v_numero,p_cultivo_id,NULLIF(trim(p_variedad),''),p_fecha_inicio,p_tiempo_cosecha,'ACTIVO',p_usuario_id);
 UPDATE tb_proyecto_cultivo SET tb_cultivo_id=p_cultivo_id,variedad=NULLIF(trim(p_variedad),''),fecha_siembra=p_fecha_inicio,tiempo_cosecha_dias=p_tiempo_cosecha,cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW() WHERE tb_proyecto_id=p_proyecto_id;
 INSERT INTO tb_historial_parametrizacion_cultivo(tb_proyecto_id,tipo_evento,origen,valores_nuevos,motivo,cod_usuario_registro) VALUES(p_proyecto_id,'Inicio de plantación','Usuario',jsonb_build_object('ciclo',v_numero,'cultivo_id',p_cultivo_id,'variedad',p_variedad,'fecha_siembra',p_fecha_inicio,'tiempo_cosecha_dias',p_tiempo_cosecha),'Nueva plantación iniciada por el administrador',p_usuario_id);
END;$$;
