-- =========================================================================
-- Nombre: tb_alerta_hidrica
-- Primary_Key: id
-- Desciprion: guardado de historico de alertas, 
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_alerta_hidrica') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_alerta_hidrica LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_alerta_hidrica CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_alerta_hidrica (
            id SERIAL PRIMARY KEY,
            tb_nodo_id INT REFERENCES tb_nodo_iot(id),
            descripcion_alerta VARCHAR(200) NOT NULL,
            estado_atencion VARCHAR(20) NOT NULL,
            tb_usuario_id INT REFERENCES tb_usuario(id),
            fecha_resolucion TIMESTAMP NULL
        );
    END IF;
END $$;