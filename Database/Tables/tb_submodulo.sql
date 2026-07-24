-- =========================================================================
-- Nombre: tb_submodulo
-- Primary_Key: id
-- Desciprion: Catalogo de submodulos dependientes de un modulo
-- =========================================================================
DO $$
DECLARE
    v_exists BOOLEAN;
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tb_submodulo'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_submodulo LIMIT 1)' INTO v_has_data;

        IF NOT v_has_data THEN
            DROP TABLE tb_submodulo CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_submodulo (
            id SERIAL PRIMARY KEY,
            tb_modulo_id INT NOT NULL REFERENCES tb_modulo(id) ON DELETE CASCADE,
            codigo_submodulo VARCHAR(80) NOT NULL UNIQUE,
            nombre_submodulo VARCHAR(100) NOT NULL,
            descripcion VARCHAR(255),
            ruta VARCHAR(120),
            orden INT NOT NULL DEFAULT 1,
            sn_activo BOOLEAN NOT NULL DEFAULT TRUE
        );
    END IF;
END $$;