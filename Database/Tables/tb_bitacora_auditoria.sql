-- =========================================================================
-- Nombre: tb_bitacora_auditoria
-- Primary_Key: id
-- Desciprion: Tabla que representa informacion respecto a cambios realizados por sistema
--=========================================================================
DO $$
DECLARE 
    v_exists BOOLEAN; 
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tb_bitacora_auditoria'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_bitacora_auditoria LIMIT 1)' INTO v_has_data;
        
        IF NOT v_has_data THEN
            DROP TABLE tb_bitacora_auditoria CASCADE;
            v_exists := FALSE; -- Forzamos la recreación
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_bitacora_auditoria (
            id SERIAL PRIMARY KEY,
            accion_realizada VARCHAR(200) NOT NULL,
            fecha_hora TIMESTAMP NOT NULL
        );
    END IF;
END $$;