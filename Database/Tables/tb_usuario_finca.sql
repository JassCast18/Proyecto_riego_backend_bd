-- =========================================================================
-- Nombre: tb_usuario_finca
-- Primary_Key: id
-- Desciprion: Tabla de conexion entre los usuarios y su finca asignada
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_usuario_finca') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_usuario_finca LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_usuario_finca CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_usuario_finca (
            id SERIAL PRIMARY KEY,
            tb_usuario_id INT REFERENCES tb_usuario(id),
            tb_finca_id INT REFERENCES tb_finca(id)
        );
    END IF;
END $$;