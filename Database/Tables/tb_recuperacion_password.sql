CREATE TABLE IF NOT EXISTS tb_recuperacion_password (
    id BIGSERIAL PRIMARY KEY,
    tb_usuario_id INT NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    fecha_expiracion TIMESTAMP NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_utilizacion TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS ix_recuperacion_password_usuario
ON tb_recuperacion_password (tb_usuario_id, fecha_creacion DESC);
