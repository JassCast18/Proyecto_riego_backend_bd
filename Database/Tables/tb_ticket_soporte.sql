-- =========================================================================
-- Nombre: tb_ticket_soporte
-- Primary_Key: id
-- Desciprion: Tabla para informacion con soporte
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_ticket_soporte') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_ticket_soporte LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_ticket_soporte CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_ticket_soporte (
            id SERIAL PRIMARY KEY,
            tb_usuario_id INT REFERENCES tb_usuario(id),
            asunto VARCHAR(150) NOT NULL,
            estado VARCHAR(20) NOT NULL,
            fecha_creacion TIMESTAMP NOT NULL
        );
    END IF;
END $$;