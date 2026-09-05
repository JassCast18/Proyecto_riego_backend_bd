CREATE OR REPLACE PROCEDURE sp_completar_reparacion_sensor(
  p_proyecto_id INT,p_usuario_id INT,p_sensor_id INT,p_observacion VARCHAR
)
LANGUAGE plpgsql AS $$
BEGIN
  IF length(trim(COALESCE(p_observacion,'')))<5 THEN
    RAISE EXCEPTION 'La observación de la reparación es obligatoria.';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM tb_sensor s JOIN tb_nodo_iot n ON n.id=s.tb_nodo_id
    JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
    WHERE s.id=p_sensor_id AND f.tb_proyecto_id=p_proyecto_id
      AND s.estado_operativo IN('EN_REVISION','REQUIERE_REPARACION')
  ) THEN RAISE EXCEPTION 'El sensor no tiene una revisión o reparación pendiente.'; END IF;

  UPDATE tb_sensor SET sn_activo=TRUE,estado_operativo='OPERATIVO',
    observacion_estado=trim(p_observacion),fecha_estado=NOW()
  WHERE id=p_sensor_id;
  INSERT INTO tb_bitacora_auditoria(accion_realizada,fecha_hora,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_nuevos,tb_usuario_id)
  VALUES('Reparación de sensor completada',NOW(),p_proyecto_id,'MANTENIMIENTO','USUARIO','tb_sensor',p_sensor_id,
    trim(p_observacion),jsonb_build_object('estado_operativo','OPERATIVO'),p_usuario_id);
  UPDATE tb_notificacion SET estado='RESUELTA',fecha_resolucion=NOW(),fecha_actualizacion=NOW()
  WHERE clave_evento LIKE 'HARDWARE:NODO:%:SENSOR:'||p_sensor_id||':REVISION'
    AND estado IN('PENDIENTE','ACTIVA','RECONOCIDA');
END;
$$;
