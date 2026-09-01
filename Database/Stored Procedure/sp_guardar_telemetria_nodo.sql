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
    -- 1. Buscar el ID del sensor de humedad asociado a este nodo específico
    SELECT id INTO v_id_sensor_humedad
    FROM tb_sensor
    WHERE tb_nodo_id = p_id_nodo AND tipo_componente = 'Higrometro_A0'
    LIMIT 1;

    -- 2. Buscar el ID del sensor de temperatura asociado a este nodo específico
    SELECT id INTO v_id_sensor_temperatura
    FROM tb_sensor
    WHERE tb_nodo_id = p_id_nodo AND tipo_componente = 'Termometro_DS18B20'
    LIMIT 1;

    -- 3. Validar de seguridad: Verificar que los sensores existan antes de insertar
    IF v_id_sensor_humedad IS NULL OR v_id_sensor_temperatura IS NULL THEN
        RAISE EXCEPTION 'Fallo de integridad: No se encontraron los sensores registrados para el nodo %', p_id_nodo;
    END IF;

    -- 4. Insertar la lectura de humedad en la tabla de telemetría
    INSERT INTO tb_telemetria (tb_sensor_id, valor_lectura, fecha_hora)
    VALUES (v_id_sensor_humedad, p_humedad, CURRENT_TIMESTAMP);

    -- 5. Insertar la lectura de temperatura en la tabla de telemetría
    INSERT INTO tb_telemetria (tb_sensor_id, valor_lectura, fecha_hora)
    VALUES (v_id_sensor_temperatura, p_temperatura, CURRENT_TIMESTAMP);

    -- El COMMIT es implícito si no ocurren errores (Transaccionalidad ACID)
END;
$$;
