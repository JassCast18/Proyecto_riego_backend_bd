-- =========================================================================
-- Nombre: tb_telemetria
-- Primary_Key: id
-- Desciprion: tabla que guarda la informacion telemetrica recolectada por sensores
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_telemetria') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_telemetria LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_telemetria CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_telemetria (
            id BIGSERIAL PRIMARY KEY,
            tb_sensor_id INT REFERENCES tb_sensor_actuador(id),
            valor_lectura DECIMAL NOT NULL,
            fecha_hora TIMESTAMP NOT NULL
        );
    END IF;
END $$;