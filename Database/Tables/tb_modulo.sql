-- =========================================================================
-- Nombre: tb_modulo
-- Primary_Key: id
-- Desciprion: Catalogo de modulos visibles en el sidebar
-- =========================================================================
DO $$
DECLARE
    v_exists BOOLEAN;
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tb_modulo'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_modulo LIMIT 1)' INTO v_has_data;

        IF NOT v_has_data THEN
            DROP TABLE tb_modulo CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_modulo (
            id SERIAL PRIMARY KEY,
            codigo_modulo VARCHAR(60) NOT NULL UNIQUE,
            nombre_modulo VARCHAR(100) NOT NULL,
            descripcion VARCHAR(255),
            icono VARCHAR(80),
            ruta VARCHAR(120),
            orden INT NOT NULL DEFAULT 1,
            sn_activo BOOLEAN NOT NULL DEFAULT TRUE
        );
    END IF;
END $$;