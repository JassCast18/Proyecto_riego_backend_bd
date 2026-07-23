-- =========================================================================
-- Nombre: tb_usuario
-- Primary_Key: id
-- Desciprion: Tabla referente al usuario que inicia sesion
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_usuario') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_usuario LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_usuario CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_usuario (
            id SERIAL PRIMARY KEY,
            tb_persona_id INT REFERENCES tb_persona(id),
            tb_rol_id INT REFERENCES tb_rol(id),
            correo_electronico VARCHAR(100) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            sn_activo BOOLEAN NOT NULL,
            cod_usuario_registro INT NOT NULL,
            fecha_registra TIMESTAMP NOT NULL,
            cod_usuario_modifica INT NULL,
            fecha_modifica TIMESTAMP NULL
        );
    END IF;
END $$;
--==================================Campo username agregado==========================
ALTER TABLE tb_usuario
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_tb_usuario_username'
    ) THEN
        ALTER TABLE tb_usuario
        ADD CONSTRAINT uq_tb_usuario_username UNIQUE (username);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tb_usuario'
        AND column_name = 'username'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE tb_usuario
        ALTER COLUMN username SET NOT NULL;
    END IF;
END $$;
-- END USERNAME