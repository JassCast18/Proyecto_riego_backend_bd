CREATE OR REPLACE PROCEDURE sp_registrar_lecturas_prueba(p_prueba_id INT,p_nodo_id INT,p_humedad DECIMAL,p_temperatura DECIMAL)
LANGUAGE plpgsql AS $$
DECLARE v_prueba tb_prueba_unitaria%ROWTYPE;v_tipo VARCHAR;v_valor DECIMAL;
BEGIN
  SELECT * INTO v_prueba FROM tb_prueba_unitaria WHERE id=p_prueba_id AND tb_nodo_id=p_nodo_id AND estado IN('ESPERANDO','EN_CURSO') FOR UPDATE;
  IF v_prueba.id IS NULL OR v_prueba.tipo_prueba<>'SENSOR' THEN RAISE EXCEPTION 'No existe una prueba de sensor activa para este nodo.'; END IF;
  SELECT tipo_componente INTO v_tipo FROM tb_sensor WHERE id=v_prueba.tb_sensor_id;
  v_valor:=CASE WHEN v_tipo ILIKE '%term%' THEN p_temperatura WHEN v_tipo ILIKE '%higr%' OR v_tipo ILIKE '%hum%' THEN p_humedad END;
  IF v_valor IS NULL THEN RAISE EXCEPTION 'No se recibió una lectura compatible con el sensor probado.'; END IF;
  INSERT INTO tb_prueba_lectura(tb_prueba_id,tb_sensor_id,valor_lectura) VALUES(p_prueba_id,v_prueba.tb_sensor_id,v_valor);
  UPDATE tb_prueba_unitaria SET estado='EN_CURSO',fecha_inicio=COALESCE(fecha_inicio,NOW()),ultima_comunicacion=NOW() WHERE id=p_prueba_id;
END;$$;
