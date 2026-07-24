-- =========================================================================
-- Nombre: tb_permiso
-- Primary_Key: id
-- Desciprion: Catalogo de permisos de acceso
-- =========================================================================
DO $$
DECLARE
    v_exists BOOLEAN;
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tb_permiso'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_permiso LIMIT 1)' INTO v_has_data;

        IF NOT v_has_data THEN
            DROP TABLE tb_permiso CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_permiso (
            id SERIAL PRIMARY KEY,
            codigo_permiso VARCHAR(80) NOT NULL UNIQUE,
            nombre_permiso VARCHAR(120) NOT NULL,
            descripcion VARCHAR(255),
            tipo_permiso VARCHAR(30) NOT NULL DEFAULT 'vista',
            sn_activo BOOLEAN NOT NULL DEFAULT TRUE
        );
    END IF;
END $$;