DROP PROCEDURE IF EXISTS sp_guardar_telemetria_gateway(INT, VARCHAR, DECIMAL, DECIMAL, DECIMAL, INT, INT);

CREATE OR REPLACE PROCEDURE sp_guardar_telemetria_gateway(
    IN p_proyecto_id INT,
    IN p_direccion_mac VARCHAR,
    IN p_temperatura DECIMAL,
    IN p_humedad_relativa DECIMAL,
    IN p_presion_hpa DECIMAL,
    IN p_prueba_id INT,
    INOUT p_nodo_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_sector_id INT;
    v_sensor_temperatura INT;
    v_sensor_humedad INT;
    v_sensor_presion INT;
    v_estado_energia VARCHAR;
    v_mac VARCHAR := UPPER(TRIM(p_direccion_mac));
BEGIN
    IF p_proyecto_id IS NULL OR p_proyecto_id <= 0 THEN
        RAISE EXCEPTION 'El proyecto del gateway es obligatorio.';
    END IF;
    IF v_mac !~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$' THEN
        RAISE EXCEPTION 'La direccion MAC del gateway no es valida.';
    END IF;
    IF p_temperatura NOT BETWEEN -40 AND 85
       OR p_humedad_relativa NOT BETWEEN 0 AND 100
       OR p_presion_hpa NOT BETWEEN 300 AND 1100 THEN
        RAISE EXCEPTION 'La lectura BME280 esta fuera de su rango fisico valido.';
    END IF;

    PERFORM pg_advisory_xact_lock(4200, p_proyecto_id);

    SELECT n.id, n.estado_energia INTO p_nodo_id, v_estado_energia
    FROM tb_nodo_iot n
    JOIN tb_sector s ON s.id=n.tb_sector_id
    JOIN tb_finca f ON f.id=s.tb_finca_id
    WHERE f.tb_proyecto_id=p_proyecto_id
      AND (n.direccion_mac=v_mac OR n.tipo_nodo='Gateway ambiental BME280')
    ORDER BY (n.direccion_mac=v_mac) DESC, n.id
    LIMIT 1;

    IF p_nodo_id IS NULL THEN
        SELECT s.id INTO v_sector_id
        FROM tb_sector s
        JOIN tb_finca f ON f.id=s.tb_finca_id
        WHERE f.tb_proyecto_id=p_proyecto_id
        ORDER BY s.id
        LIMIT 1;
        IF v_sector_id IS NULL THEN
            RAISE EXCEPTION 'El proyecto necesita una finca y un sector antes de registrar el gateway.';
        END IF;
        INSERT INTO tb_nodo_iot(tb_sector_id,tipo_nodo,direccion_mac,estado_energia)
        VALUES(v_sector_id,'Gateway ambiental BME280',v_mac,'ENCENDIDO')
        RETURNING id,estado_energia INTO p_nodo_id,v_estado_energia;
    ELSE
        UPDATE tb_nodo_iot SET direccion_mac=v_mac WHERE id=p_nodo_id;
    END IF;

    SELECT id INTO v_sensor_temperatura FROM tb_sensor
    WHERE tb_nodo_id=p_nodo_id AND tipo_componente='BME280_TEMPERATURA_AMBIENTE' LIMIT 1;
    IF v_sensor_temperatura IS NULL THEN
        INSERT INTO tb_sensor(tb_nodo_id,tipo_componente,nombre,unidad,recomendacion_prueba)
        VALUES(p_nodo_id,'BME280_TEMPERATURA_AMBIENTE','Temperatura ambiental','C','Compara la lectura con un termometro ambiental de referencia y evita tocar el sensor.')
        RETURNING id INTO v_sensor_temperatura;
    END IF;

    SELECT id INTO v_sensor_humedad FROM tb_sensor
    WHERE tb_nodo_id=p_nodo_id AND tipo_componente='BME280_HUMEDAD_RELATIVA' LIMIT 1;
    IF v_sensor_humedad IS NULL THEN
        INSERT INTO tb_sensor(tb_nodo_id,tipo_componente,nombre,unidad,recomendacion_prueba)
        VALUES(p_nodo_id,'BME280_HUMEDAD_RELATIVA','Humedad relativa ambiental','%','Compara la lectura con un higrometro ambiental y evita condensacion directa sobre el sensor.')
        RETURNING id INTO v_sensor_humedad;
    END IF;

    SELECT id INTO v_sensor_presion FROM tb_sensor
    WHERE tb_nodo_id=p_nodo_id AND tipo_componente='BME280_PRESION_ATMOSFERICA' LIMIT 1;
    IF v_sensor_presion IS NULL THEN
        INSERT INTO tb_sensor(tb_nodo_id,tipo_componente,nombre,unidad,recomendacion_prueba)
        VALUES(p_nodo_id,'BME280_PRESION_ATMOSFERICA','Presion atmosferica','hPa','Compara la lectura con una estacion meteorologica cercana y manten libre el orificio del sensor.')
        RETURNING id INTO v_sensor_presion;
    END IF;

    IF COALESCE(p_prueba_id,0)>0 THEN
        CALL sp_registrar_lectura_prueba_ambiental(
            p_prueba_id,p_nodo_id,p_temperatura,p_humedad_relativa,p_presion_hpa
        );
    ELSIF v_estado_energia<>'APAGADO' THEN
        IF EXISTS(SELECT 1 FROM tb_sensor WHERE id=v_sensor_temperatura AND sn_activo AND estado_operativo='OPERATIVO') THEN
            INSERT INTO tb_telemetria(tb_sensor_id,valor_lectura,fecha_hora)
            VALUES(v_sensor_temperatura,p_temperatura,CURRENT_TIMESTAMP);
        END IF;
        IF EXISTS(SELECT 1 FROM tb_sensor WHERE id=v_sensor_humedad AND sn_activo AND estado_operativo='OPERATIVO') THEN
            INSERT INTO tb_telemetria(tb_sensor_id,valor_lectura,fecha_hora)
            VALUES(v_sensor_humedad,p_humedad_relativa,CURRENT_TIMESTAMP);
        END IF;
        IF EXISTS(SELECT 1 FROM tb_sensor WHERE id=v_sensor_presion AND sn_activo AND estado_operativo='OPERATIVO') THEN
            INSERT INTO tb_telemetria(tb_sensor_id,valor_lectura,fecha_hora)
            VALUES(v_sensor_presion,p_presion_hpa,CURRENT_TIMESTAMP);
        END IF;
    END IF;
END;
$$;
