CREATE OR REPLACE PROCEDURE sp_guardar_telemetria_nodo(
    p_id_nodo INT,
    p_humedad DECIMAL,
    p_temperatura DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_sensor_humedad INT;
    v_id_sensor_temperatura INT;
BEGIN
    SELECT id INTO v_id_sensor_humedad
    FROM tb_sensor
    WHERE tb_nodo_id=p_id_nodo AND tipo_componente='Higrometro_A0'
      AND sn_activo=TRUE AND estado_operativo='OPERATIVO'
    LIMIT 1;

    SELECT id INTO v_id_sensor_temperatura
    FROM tb_sensor
    WHERE tb_nodo_id=p_id_nodo AND tipo_componente='Termometro_DS18B20'
      AND sn_activo=TRUE AND estado_operativo='OPERATIVO'
    LIMIT 1;

    IF v_id_sensor_humedad IS NOT NULL THEN
        INSERT INTO tb_telemetria(tb_sensor_id,valor_lectura,fecha_hora)
        VALUES(v_id_sensor_humedad,p_humedad,CURRENT_TIMESTAMP);
    END IF;

    IF v_id_sensor_temperatura IS NOT NULL THEN
        INSERT INTO tb_telemetria(tb_sensor_id,valor_lectura,fecha_hora)
        VALUES(v_id_sensor_temperatura,p_temperatura,CURRENT_TIMESTAMP);
    END IF;
    IF v_id_sensor_humedad IS NOT NULL THEN
        CALL sp_evaluar_riego_automatico(p_id_nodo,p_humedad);
    END IF;
END;
$$;
