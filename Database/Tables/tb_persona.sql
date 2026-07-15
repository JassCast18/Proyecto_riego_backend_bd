-- =========================================================================
-- Nombre: tb_persona
-- Primary_Key: id
-- Desciprion: Tabla general con informacion sobre usuario o clientes del sistema
-- =========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_persona') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_persona LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_persona CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_persona (
            id SERIAL PRIMARY KEY,
            nombres VARCHAR(80) NOT NULL,
            apellidos VARCHAR(80) NOT NULL,
            fecha_modificacion TIMESTAMP NULL,
            cod_usuario_registro INT NOT NULL,
            fecha_registra TIMESTAMP NOT NULL,
            cod_usuario_modifica INT NULL,
            fecha_modifica TIMESTAMP NULL
        );
    END IF;
END $$;