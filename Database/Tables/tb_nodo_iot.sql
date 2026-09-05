-- =========================================================================
-- Nombre: tb_nodo_iot
-- Primary_Key: id
-- Desciprion: conexion de parametrizacion de nodo
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_nodo_iot') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_nodo_iot LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_nodo_iot CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_nodo_iot (
            id SERIAL PRIMARY KEY,
            tb_sector_id INT REFERENCES tb_sector(id),
            tipo_nodo VARCHAR(50) NOT NULL,
            direccion_mac VARCHAR(17) NOT NULL,
            estado_energia VARCHAR(20) NOT NULL
        );
    END IF;
END $$;

DROP TRIGGER IF EXISTS tr_normalizar_nombre_nodo ON tb_nodo_iot;
DROP FUNCTION IF EXISTS fn_normalizar_nombre_nodo();
ALTER TABLE tb_nodo_iot DROP COLUMN IF EXISTS nombre_nodo;
