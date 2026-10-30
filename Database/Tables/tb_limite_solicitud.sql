CREATE TABLE IF NOT EXISTS tb_limite_solicitud(
 clave VARCHAR(255) PRIMARY KEY,
 cantidad INT NOT NULL DEFAULT 1,
 reinicia_en TIMESTAMPTZ NOT NULL,
 actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_limite_solicitud_reinicio ON tb_limite_solicitud(reinicia_en);
