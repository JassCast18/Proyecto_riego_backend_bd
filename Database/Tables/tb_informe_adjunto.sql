CREATE TABLE IF NOT EXISTS tb_informe_adjunto (
    id BIGSERIAL PRIMARY KEY,
    tb_informe_id INT NOT NULL REFERENCES tb_informe_supervision(id) ON DELETE CASCADE,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(120) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_informe_adjunto_informe ON tb_informe_adjunto(tb_informe_id);
