-- =========================================================================
-- Nombre: tb_sensor_actuador
-- Primary_Key: id
-- Desciprion: parametrizacion de sensores actuadores
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_sensor_actuador') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_sensor_actuador LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_sensor_actuador CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_sensor_actuador (
            id SERIAL PRIMARY KEY,
            tb_nodo_id INT REFERENCES tb_nodo_iot(id),
            tipo_componente VARCHAR(50) NOT NULL
        );
    END IF;
END $$;