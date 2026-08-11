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

ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id) ON DELETE CASCADE;
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS categoria VARCHAR(40) NOT NULL DEFAULT 'SISTEMA';
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS origen VARCHAR(30) NOT NULL DEFAULT 'SISTEMA';
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS entidad VARCHAR(60);
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS entidad_id INT;
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS detalle TEXT;
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS valores_anteriores JSONB;
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS valores_nuevos JSONB;
ALTER TABLE tb_bitacora_auditoria ADD COLUMN IF NOT EXISTS tb_usuario_id INT REFERENCES tb_usuario(id);
ALTER TABLE tb_bitacora_auditoria ALTER COLUMN fecha_hora SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS ix_bitacora_auditoria_proyecto_fecha
ON tb_bitacora_auditoria(tb_proyecto_id,fecha_hora DESC);
