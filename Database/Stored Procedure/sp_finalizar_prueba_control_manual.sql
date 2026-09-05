DROP PROCEDURE IF EXISTS sp_finalizar_prueba_control_manual(INT,INT,INT,BOOLEAN,VARCHAR,VARCHAR);
CREATE OR REPLACE PROCEDURE sp_finalizar_prueba_control_manual(
  p_prueba_id INT,p_proyecto_id INT,p_usuario_id INT,p_cancelar BOOLEAN,p_resultado VARCHAR,p_conclusion VARCHAR,
  p_desactivar_sensor BOOLEAN DEFAULT FALSE
)
LANGUAGE plpgsql AS $$
DECLARE v_prueba tb_prueba_unitaria%ROWTYPE;v_admin BOOLEAN;
BEGIN
  SELECT * INTO v_prueba FROM tb_prueba_unitaria WHERE id=p_prueba_id AND tb_proyecto_id=p_proyecto_id FOR UPDATE;
  IF v_prueba.id IS NULL THEN RAISE EXCEPTION 'La prueba no existe.'; END IF;
  SELECT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND tb_rol_id=1 AND sn_activo) INTO v_admin;
  IF v_prueba.tb_usuario_id<>p_usuario_id AND NOT v_admin THEN RAISE EXCEPTION 'Solo el responsable o un administrador puede finalizar la prueba.'; END IF;
  IF v_prueba.estado IN('FINALIZADA','CANCELADA','FALLIDA') THEN RAISE EXCEPTION 'La prueba ya finalizó.'; END IF;

  UPDATE tb_prueba_unitaria SET estado=CASE WHEN p_cancelar THEN 'CANCELADA' ELSE 'FINALIZADA' END,
    resultado=CASE WHEN p_cancelar THEN 'CANCELADA' ELSE upper(COALESCE(NULLIF(trim(p_resultado),''),'REQUIERE_REVISION')) END,
    conclusion=NULLIF(trim(p_conclusion),''),fecha_fin=NOW() WHERE id=p_prueba_id;
  UPDATE tb_comando_iot SET estado='EXPIRADO',fecha_expiracion=NOW()
  WHERE tb_prueba_id=p_prueba_id AND estado IN('PENDIENTE','ENTREGADO');
  INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tb_prueba_id,tipo_comando,payload)
  VALUES(p_proyecto_id,v_prueba.tb_nodo_id,p_prueba_id,
    CASE WHEN v_prueba.tipo_prueba='ACTUADOR' THEN 'DESACTIVAR_ACTUADOR' ELSE 'FINALIZAR_PRUEBA' END,
    jsonb_build_object('pruebaId',p_prueba_id,'intervaloSegundos',900,'componenteId',COALESCE(v_prueba.tb_actuador_id,v_prueba.tb_sensor_id)));
  IF NOT p_cancelar AND v_prueba.tipo_prueba='SENSOR' THEN
    UPDATE tb_sensor SET
      estado_operativo=CASE upper(COALESCE(p_resultado,''))
        WHEN 'REQUIERE_REVISION' THEN 'EN_REVISION'
        WHEN 'REQUIERE_REPARACION' THEN 'REQUIERE_REPARACION'
        WHEN 'FALLIDA' THEN 'REQUIERE_REPARACION'
        ELSE 'OPERATIVO' END,
      sn_activo=CASE WHEN upper(COALESCE(p_resultado,''))='APROBADA' THEN TRUE ELSE FALSE END,
      observacion_estado=NULLIF(trim(p_conclusion),''),fecha_estado=NOW()
    WHERE id=v_prueba.tb_sensor_id;
  END IF;
  UPDATE tb_notificacion SET estado='RESUELTA',fecha_resolucion=NOW(),fecha_actualizacion=NOW()
  WHERE clave_evento='PRUEBA_CONTROL_MANUAL:'||p_prueba_id
    AND estado IN('PENDIENTE','ACTIVA','RECONOCIDA');
END;$$;
