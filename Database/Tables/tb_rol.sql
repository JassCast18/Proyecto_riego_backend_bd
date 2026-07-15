-- =========================================================================
-- Nombre: tb_rol
-- Primary_Key: id
-- Desciprion: Tabla que representa los roles del sistema
--  =========================================================================
DO $$
DECLARE 
    v_exists BOOLEAN; 
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tb_rol'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_rol LIMIT 1)' INTO v_has_data;
        
        IF NOT v_has_data THEN
            DROP TABLE tb_rol CASCADE;
            v_exists := FALSE; -- Forzamos la recreación
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_rol (
            id SERIAL PRIMARY KEY,
            nombre_rol VARCHAR(50) NOT NULL
        );
    END IF;
END $$;