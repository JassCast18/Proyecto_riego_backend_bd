-- =========================================================================
-- Nombre: tb_cliente
-- Primary_Key: id
-- Desciprion: Tabla referente al cliente para dividir informacion segun cliente implementado
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_cliente') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_cliente LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_cliente CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_cliente (
            id SERIAL PRIMARY KEY,
            tb_persona_id INT REFERENCES tb_persona(id),
            NIT VARCHAR(20),
            direccion VARCHAR(100) NOT NULL,
            telefono INT
        );
    END IF;
END $$;