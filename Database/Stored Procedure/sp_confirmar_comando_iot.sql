CREATE OR REPLACE PROCEDURE sp_confirmar_comando_iot(p_comando_id BIGINT,p_exitoso BOOLEAN,p_mensaje VARCHAR)
LANGUAGE plpgsql AS $$
DECLARE v_comando tb_comando_iot%ROWTYPE;v_actuador INT;
BEGIN
  SELECT * INTO v_comando FROM tb_comando_iot WHERE id=p_comando_id FOR UPDATE;
  IF v_comando.id IS NULL THEN RAISE EXCEPTION 'El comando no existe.'; END IF;
  UPDATE tb_comando_iot SET estado=CASE WHEN p_exitoso THEN 'CONFIRMADO' ELSE 'FALLIDO' END,
    fecha_confirmacion=NOW(),mensaje_confirmacion=left(p_mensaje,300) WHERE id=p_comando_id;
  IF p_exitoso AND v_comando.tb_prueba_id IS NOT NULL THEN
    UPDATE tb_prueba_unitaria SET estado=CASE WHEN v_comando.tipo_comando IN('FINALIZAR_PRUEBA','DESACTIVAR_ACTUADOR') THEN estado ELSE 'EN_CURSO' END,
      fecha_inicio=COALESCE(fecha_inicio,NOW()),ultima_comunicacion=NOW() WHERE id=v_comando.tb_prueba_id;
  END IF;
  v_actuador:=NULLIF(v_comando.payload->>'componenteId','')::INT;
  IF p_exitoso AND v_actuador IS NOT NULL AND v_comando.tipo_comando IN('ACTIVAR_ACTUADOR','DESACTIVAR_ACTUADOR') THEN
    UPDATE tb_actuador SET estado_actual=CASE WHEN v_comando.tipo_comando='ACTIVAR_ACTUADOR' THEN 'ACTIVO' ELSE 'INACTIVO' END WHERE id=v_actuador;
  END IF;
END;$$;
