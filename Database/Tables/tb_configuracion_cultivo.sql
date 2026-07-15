-- =========================================================================
-- Nombre: tb_configuracion_cultivo
-- Primary_Key: id
-- Desciprion: Tabla de configuracion inicial para el cultivo
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_configuracion_cultivo') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_configuracion_cultivo LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_configuracion_cultivo CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_configuracion_cultivo (
            id SERIAL PRIMARY KEY,
            tb_finca_id INT REFERENCES tb_finca(id),
            tipo_cultivo VARCHAR(80) NOT NULL,
            tiempo_cosecha_dias INT NOT NULL,
            umbral_humedad_ideal DECIMAL NOT NULL,
            cod_usuario_registro INT NOT NULL,
            fecha_registra TIMESTAMP NOT NULL,
            cod_usuario_modifica INT NULL,
            fecha_modifica TIMESTAMP NULL
        );
    END IF;
END $$;