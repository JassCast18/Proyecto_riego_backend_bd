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

ALTER TABLE tb_informe_supervision ALTER COLUMN ruta_documento_pdf DROP NOT NULL;
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id) ON DELETE CASCADE;
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS tb_ciclo_cultivo_id INT REFERENCES tb_ciclo_cultivo(id);
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS titulo VARCHAR(150);
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS asunto VARCHAR(200);
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS estado_general VARCHAR(30);
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS presencia_plagas BOOLEAN;
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS descripcion_plagas VARCHAR(300);
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS acciones_realizadas TEXT;
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS fecha_observacion DATE;
ALTER TABLE tb_informe_supervision ADD COLUMN IF NOT EXISTS fecha_registra TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS ix_informe_supervision_proyecto_fecha
ON tb_informe_supervision(tb_proyecto_id,fecha_observacion DESC,fecha_registra DESC);
