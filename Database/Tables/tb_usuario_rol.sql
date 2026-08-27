CREATE TABLE IF NOT EXISTS tb_usuario_rol (
    id SERIAL PRIMARY KEY,
    tb_usuario_id INT NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
    tb_rol_id INT NOT NULL REFERENCES tb_rol(id),
    tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
    recibe_alertas_correo BOOLEAN NOT NULL DEFAULT FALSE,
    cod_usuario_registro INT REFERENCES tb_usuario(id),
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW(),
    cod_usuario_modifica INT REFERENCES tb_usuario(id),
    fecha_modifica TIMESTAMP,
    CONSTRAINT uq_tb_usuario_rol_proyecto UNIQUE (tb_usuario_id, tb_proyecto_id)
);

ALTER TABLE tb_usuario_rol
ADD COLUMN IF NOT EXISTS recibe_alertas_correo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ix_tb_usuario_rol_proyecto
ON tb_usuario_rol (tb_proyecto_id, sn_activo);
