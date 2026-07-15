-- =========================================================================
-- Nombre: tb_prueba_unitaria
-- Primary_Key: id
-- Desciprion: tabla temporal para recoleccion de pruebas unitarias
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_prueba_unitaria') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_prueba_unitaria LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_prueba_unitaria CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_prueba_unitaria (
            id SERIAL PRIMARY KEY,
            tb_nodo_id INT REFERENCES tb_nodo_iot(id),
            tb_usuario_id INT REFERENCES tb_usuario(id),
            is_test BOOLEAN NOT NULL,
            fecha_hora TIMESTAMP NOT NULL
        );
    END IF;
END $$;