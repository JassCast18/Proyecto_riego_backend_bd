-- =========================================================================
-- Nombre: tb_version_modelo_ia
-- Primary_Key: id
-- Desciprion: Tabla para informacion sobre versionado de ia
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_version_modelo_ia') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_version_modelo_ia LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_version_modelo_ia CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_version_modelo_ia (
            id SERIAL PRIMARY KEY,
            tb_usuario_id INT REFERENCES tb_usuario(id),
            ruta_pesos_algoritmo VARCHAR(255) NOT NULL,
            sn_activo BOOLEAN NOT NULL
        );
    END IF;
END $$;