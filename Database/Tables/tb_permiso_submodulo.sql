-- =========================================================================
-- Nombre: tb_permiso_submodulo
-- Primary_Key: id
-- Desciprion: Relacion entre roles, submodulos y permisos
-- =========================================================================
DO $$
DECLARE
    v_exists BOOLEAN;
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tb_permiso_submodulo'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_permiso_submodulo LIMIT 1)' INTO v_has_data;

        IF NOT v_has_data THEN
            DROP TABLE tb_permiso_submodulo CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_permiso_submodulo (
            id SERIAL PRIMARY KEY,
            tb_rol_id INT NOT NULL REFERENCES tb_rol(id) ON DELETE CASCADE,
            tb_submodulo_id INT NOT NULL REFERENCES tb_submodulo(id) ON DELETE CASCADE,
            tb_permiso_id INT NOT NULL REFERENCES tb_permiso(id) ON DELETE CASCADE,
            sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
            CONSTRAINT uq_tb_permiso_submodulo UNIQUE (tb_rol_id, tb_submodulo_id, tb_permiso_id)
        );
    END IF;
END $$;