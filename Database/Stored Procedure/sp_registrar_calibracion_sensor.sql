CREATE OR REPLACE PROCEDURE sp_registrar_calibracion_sensor(
  IN p_proyecto_id INT,IN p_usuario_id INT,IN p_sensor_id INT,IN p_prueba_id INT,
  IN p_adc_seco DECIMAL,IN p_adc_humedo DECIMAL
)
LANGUAGE plpgsql AS $$
DECLARE v_nodo_id INT;v_tipo VARCHAR;
BEGIN
  SELECT s.tb_nodo_id,s.tipo_componente INTO v_nodo_id,v_tipo
  FROM tb_sensor s JOIN tb_nodo_iot n ON n.id=s.tb_nodo_id
  JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
  WHERE s.id=p_sensor_id AND s.sn_activo=TRUE AND f.tb_proyecto_id=p_proyecto_id;
  IF v_nodo_id IS NULL THEN RAISE EXCEPTION 'El sensor no pertenece al proyecto seleccionado.'; END IF;
  IF v_tipo NOT ILIKE '%higr%' AND v_tipo NOT ILIKE '%hum%' THEN RAISE EXCEPTION 'Solo los sensores de humedad admiten calibracion seca y humeda.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM tb_nodo_iot WHERE id=v_nodo_id AND estado_energia='APAGADO') THEN RAISE EXCEPTION 'El nodo debe permanecer apagado durante la calibracion.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM tb_prueba_unitaria WHERE id=p_prueba_id AND tb_proyecto_id=p_proyecto_id AND tb_nodo_id=v_nodo_id AND tb_sensor_id=p_sensor_id AND tipo_prueba='SENSOR') THEN RAISE EXCEPTION 'La prueba tecnica no corresponde al sensor calibrado.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM tb_prueba_lectura WHERE tb_prueba_id=p_prueba_id) THEN RAISE EXCEPTION 'La prueba no contiene lecturas para respaldar la calibracion.'; END IF;
  IF p_adc_seco IS NULL OR p_adc_humedo IS NULL OR p_adc_seco<=p_adc_humedo OR p_adc_seco-p_adc_humedo<50 THEN RAISE EXCEPTION 'La lectura seca debe superar a la humeda por al menos 50 ADC.'; END IF;
  IF p_adc_seco>1023 OR p_adc_humedo<0 THEN RAISE EXCEPTION 'Las lecturas de calibracion deben estar entre 0 y 1023 ADC.'; END IF;

  UPDATE tb_sensor SET adc_seco=p_adc_seco,adc_humedo=p_adc_humedo,unidad='%',fecha_calibracion=NOW(),cod_usuario_calibracion=p_usuario_id WHERE id=p_sensor_id;
  INSERT INTO tb_calibracion_sensor(tb_sensor_id,tb_prueba_id,tb_usuario_id,adc_seco,adc_humedo)
  VALUES(p_sensor_id,p_prueba_id,p_usuario_id,p_adc_seco,p_adc_humedo);
END;$$;
