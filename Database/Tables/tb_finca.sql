-- =========================================================================
-- Nombre: tb_finca
-- Primary_Key: id
-- Desciprion: Tabla referente a la finca, para ofrecer division de tierras en proyecto
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_finca') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_finca LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_finca CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_finca (
            id SERIAL PRIMARY KEY,
            tb_cliente_id INT REFERENCES tb_cliente(id),
            ubicacion_geografica VARCHAR(100) NOT NULL
        );
    END IF;
END $$;