-- =========================================================================
-- Nombre: tb_permiso_modulo
-- Primary_Key: id
-- Desciprion: Relacion entre roles, modulos y permisos
-- =========================================================================
DO $$
DECLARE
    v_exists BOOLEAN;
    v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tb_permiso_modulo'
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_permiso_modulo LIMIT 1)' INTO v_has_data;

        IF NOT v_has_data THEN
            DROP TABLE tb_permiso_modulo CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;

    IF NOT v_exists THEN
        CREATE TABLE tb_permiso_modulo (
            id SERIAL PRIMARY KEY,
            tb_rol_id INT NOT NULL REFERENCES tb_rol(id) ON DELETE CASCADE,
            tb_modulo_id INT NOT NULL REFERENCES tb_modulo(id) ON DELETE CASCADE,
            tb_permiso_id INT NOT NULL REFERENCES tb_permiso(id) ON DELETE CASCADE,
            sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
            CONSTRAINT uq_tb_permiso_modulo UNIQUE (tb_rol_id, tb_modulo_id, tb_permiso_id)
        );
    END IF;
END $$;