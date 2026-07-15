-- =========================================================================
-- Nombre: tb_sector
-- Primary_Key: id
-- Desciprion: division por sectores para componentes electronicos
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_sector') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_sector LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_sector CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_sector (
            id SERIAL PRIMARY KEY,
            tb_finca_id INT REFERENCES tb_finca(id),
            nombre_sector VARCHAR(80) NOT NULL
        );
    END IF;
END $$;