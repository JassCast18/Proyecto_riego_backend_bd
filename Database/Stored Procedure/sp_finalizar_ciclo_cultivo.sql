CREATE OR REPLACE PROCEDURE sp_finalizar_ciclo_cultivo(
 IN p_proyecto_id INT,IN p_usuario_id INT,IN p_fecha_fin DATE,IN p_resultado VARCHAR,
 IN p_cantidad DECIMAL,IN p_unidad VARCHAR,IN p_calidad VARCHAR,IN p_observaciones TEXT,
 IN p_fecha_brote DATE,IN p_porcentaje_brote DECIMAL
)
LANGUAGE plpgsql AS $$
DECLARE v_ciclo tb_ciclo_cultivo%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND tb_rol_id=1 AND sn_activo=TRUE) THEN RAISE EXCEPTION 'Solo un administrador puede finalizar la plantación.'; END IF;
 SELECT * INTO v_ciclo FROM tb_ciclo_cultivo WHERE tb_proyecto_id=p_proyecto_id AND estado='ACTIVO' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'El proyecto no tiene una plantación activa.'; END IF;
 IF p_fecha_fin IS NULL OR p_fecha_fin<COALESCE(v_ciclo.fecha_inicio,p_fecha_fin) THEN RAISE EXCEPTION 'La fecha de finalización no es válida.'; END IF;
 IF upper(COALESCE(p_resultado,'')) NOT IN('COSECHADA','CANCELADA','PERDIDA','PARCIAL') THEN RAISE EXCEPTION 'Selecciona un resultado válido.'; END IF;
 IF p_unidad IS NOT NULL AND lower(trim(p_unidad)) NOT IN('kg','lb','g','qq','t','unidades','cajas','sacos') THEN RAISE EXCEPTION 'Selecciona una unidad de cosecha válida.'; END IF;
 IF p_porcentaje_brote IS NOT NULL AND (p_porcentaje_brote<0 OR p_porcentaje_brote>100) THEN RAISE EXCEPTION 'El porcentaje de brote debe estar entre 0 y 100.'; END IF;
 UPDATE tb_ciclo_cultivo SET fecha_fin=p_fecha_fin,estado=CASE WHEN upper(p_resultado)='CANCELADA' THEN 'CANCELADO' ELSE 'FINALIZADO' END,resultado_final=upper(p_resultado),cantidad_cosechada=p_cantidad,unidad_cosecha=NULLIF(trim(p_unidad),''),calidad_cosecha=NULLIF(trim(p_calidad),''),observaciones_cierre=NULLIF(trim(p_observaciones),''),fecha_primer_brote=p_fecha_brote,porcentaje_brote=p_porcentaje_brote,cod_usuario_cierre=p_usuario_id,fecha_cierre=NOW() WHERE id=v_ciclo.id;
 INSERT INTO tb_historial_parametrizacion_cultivo(tb_proyecto_id,tipo_evento,origen,valores_nuevos,motivo,cod_usuario_registro) VALUES(p_proyecto_id,'Finalización de plantación','Usuario',jsonb_build_object('ciclo',v_ciclo.numero_ciclo,'resultado',upper(p_resultado),'fecha_fin',p_fecha_fin,'cantidad',p_cantidad,'unidad',p_unidad,'fecha_primer_brote',p_fecha_brote,'porcentaje_brote',p_porcentaje_brote),COALESCE(NULLIF(trim(p_observaciones),''),'Cierre confirmado por el administrador'),p_usuario_id);
END;$$;
