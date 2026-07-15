-- =========================================================================
-- Nombre: tb_informe_supervision
-- Primary_Key: id
-- Desciprion: historico de archivos de informes registrados 
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_informe_supervision') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_informe_supervision LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_informe_supervision CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_informe_supervision (
            id SERIAL PRIMARY KEY,
            tb_usuario_id INT REFERENCES tb_usuario(id),
            tb_nodo_id INT REFERENCES tb_nodo_iot(id),
            ruta_documento_pdf VARCHAR(255) NOT NULL
        );
    END IF;
END $$;