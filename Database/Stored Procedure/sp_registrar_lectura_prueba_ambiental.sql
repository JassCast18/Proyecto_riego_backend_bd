CREATE OR REPLACE PROCEDURE sp_registrar_lectura_prueba_ambiental(
    IN p_prueba_id INT,
    IN p_nodo_id INT,
    IN p_temperatura DECIMAL,
    IN p_humedad_relativa DECIMAL,
    IN p_presion_hpa DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_prueba tb_prueba_unitaria%ROWTYPE;
    v_tipo VARCHAR;
    v_valor DECIMAL;
BEGIN
    SELECT * INTO v_prueba
    FROM tb_prueba_unitaria
    WHERE id=p_prueba_id AND tb_nodo_id=p_nodo_id
      AND estado IN('ESPERANDO','EN_CURSO')
    FOR UPDATE;
    IF v_prueba.id IS NULL OR v_prueba.tipo_prueba<>'SENSOR' THEN
        RAISE EXCEPTION 'No existe una prueba ambiental activa para este gateway.';
    END IF;

    SELECT tipo_componente INTO v_tipo FROM tb_sensor WHERE id=v_prueba.tb_sensor_id;
    v_valor:=CASE v_tipo
        WHEN 'BME280_TEMPERATURA_AMBIENTE' THEN p_temperatura
        WHEN 'BME280_HUMEDAD_RELATIVA' THEN p_humedad_relativa
        WHEN 'BME280_PRESION_ATMOSFERICA' THEN p_presion_hpa
    END;
    IF v_valor IS NULL THEN
        RAISE EXCEPTION 'La prueba seleccionada no corresponde a un sensor BME280.';
    END IF;

    INSERT INTO tb_prueba_lectura(tb_prueba_id,tb_sensor_id,valor_lectura)
    VALUES(p_prueba_id,v_prueba.tb_sensor_id,v_valor);
    UPDATE tb_prueba_unitaria
    SET estado='EN_CURSO',fecha_inicio=COALESCE(fecha_inicio,NOW()),ultima_comunicacion=NOW()
    WHERE id=p_prueba_id;
END;
$$;
