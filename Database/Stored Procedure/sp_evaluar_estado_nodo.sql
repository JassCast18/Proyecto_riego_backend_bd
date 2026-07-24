CREATE OR REPLACE PROCEDURE sp_evaluar_estado_nodo(
    p_id_nodo INT,
    OUT p_estado_general VARCHAR,
    OUT p_estado_temp VARCHAR,
    OUT p_mensaje_temp VARCHAR,
    OUT p_estado_hum VARCHAR,
    OUT p_mensaje_hum VARCHAR,
    OUT p_ultima_conexion TIMESTAMP
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_sensor_temp INT;
    v_id_sensor_hum INT;
    v_temp_actual DECIMAL;
    v_temp_anterior DECIMAL;
    v_hum_actual DECIMAL;
    v_minutos_inactividad DECIMAL;
BEGIN
    -- 1. Inicializar valores por defecto como 'OK'
    p_estado_general := 'OK';
    p_estado_temp := 'OK';
    p_mensaje_temp := 'Operando con normalidad';
    p_estado_hum := 'OK';
    p_mensaje_hum := 'Operando con normalidad';

    -- 2. Obtener IDs de los sensores asociados a este nodo
    SELECT id INTO v_id_sensor_temp
    FROM tb_sensor_actuador
    WHERE tb_nodo_id = p_id_nodo AND tipo_componente = 'Termometro_DS18B20'
    LIMIT 1;

    SELECT id INTO v_id_sensor_hum
    FROM tb_sensor_actuador
    WHERE tb_nodo_id = p_id_nodo AND tipo_componente = 'Higrometro_A0'
    LIMIT 1;

    -- 3. Obtener la última fecha de conexión de este nodo
    SELECT MAX(fecha_hora) INTO p_ultima_conexion
    FROM tb_telemetria
    WHERE tb_sensor_id IN (v_id_sensor_temp, v_id_sensor_hum);

    -- 4. REGLA 1: INACTIVIDAD (¿El Wemos está muerto?)
    IF p_ultima_conexion IS NULL THEN
        p_estado_general := 'ERROR';
        p_estado_temp := 'OFFLINE';
        p_mensaje_temp := 'No hay datos registrados.';
        p_estado_hum := 'OFFLINE';
        p_mensaje_hum := 'No hay datos registrados.';
        RETURN;
    END IF;

    -- Calcular minutos desde la última lectura
    v_minutos_inactividad := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p_ultima_conexion)) / 60;

    -- Timeout de 10 minutos
    IF v_minutos_inactividad > 10 THEN
        p_estado_general := 'ERROR';
        p_estado_temp := 'OFFLINE';
        p_mensaje_temp := 'Sin comunicación hace ' || ROUND(v_minutos_inactividad) || ' minutos.';
        p_estado_hum := 'OFFLINE';
        p_mensaje_hum := 'Nodo desconectado.';
        RETURN; -- Salimos del SP si está offline, no hay necesidad de evaluar lo demás
    END IF;

    -- 5. REGLA 2: EVALUAR TEMPERATURA (DS18B20)
    SELECT valor_lectura INTO v_temp_actual
    FROM tb_telemetria
    WHERE tb_sensor_id = v_id_sensor_temp
    ORDER BY fecha_hora DESC
    LIMIT 1;

    SELECT valor_lectura INTO v_temp_anterior
    FROM tb_telemetria
    WHERE tb_sensor_id = v_id_sensor_temp
    ORDER BY fecha_hora DESC
    OFFSET 1 LIMIT 1;

    IF v_temp_actual IS NOT NULL THEN
        IF v_temp_actual = -127.00 THEN
            p_estado_temp := 'ERROR';
            p_mensaje_temp := 'Cable de datos desconectado (-127).';
            p_estado_general := 'ERROR';
        ELSIF v_temp_anterior IS NOT NULL AND ABS(v_temp_actual - v_temp_anterior) > 5 THEN
            p_estado_temp := 'WARNING';
            p_mensaje_temp := 'Anomalía: Salto de ' || ABS(v_temp_actual - v_temp_anterior) || '°C detectado.';
            IF p_estado_general != 'ERROR' THEN p_estado_general := 'WARNING'; END IF;
        END IF;
    END IF;

    -- 6. REGLA 3: EVALUAR HUMEDAD (A0)
    SELECT valor_lectura INTO v_hum_actual
    FROM tb_telemetria
    WHERE tb_sensor_id = v_id_sensor_hum
    ORDER BY fecha_hora DESC
    LIMIT 1;

    IF v_hum_actual IS NOT NULL THEN
        IF v_hum_actual <= 10 OR v_hum_actual >= 1023 THEN
            p_estado_hum := 'ERROR';
            p_mensaje_hum := 'Posible cortocircuito o sensor fuera de tierra.';
            p_estado_general := 'ERROR';
        END IF;
    END IF;

END;
$$;