ALTER TABLE tb_notificacion
ADD COLUMN IF NOT EXISTS tb_usuario_destino_id INT REFERENCES tb_usuario(id);

ALTER TABLE tb_ticket_comentario
ADD COLUMN IF NOT EXISTS autor_externo VARCHAR(180);

CREATE TABLE IF NOT EXISTS tb_ticket_adjunto (
    id BIGSERIAL PRIMARY KEY,
    tb_ticket_soporte_id INT NOT NULL REFERENCES tb_ticket_soporte(id) ON DELETE CASCADE,
    tb_ticket_comentario_id BIGINT REFERENCES tb_ticket_comentario(id) ON DELETE CASCADE,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(600) NOT NULL,
    tipo_mime VARCHAR(120) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    jira_attachment_id VARCHAR(60),
    estado_sincronizacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    ultimo_error VARCHAR(500),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_ticket_adjunto_sync CHECK (estado_sincronizacion IN ('PENDIENTE','SINCRONIZADO','ERROR'))
);
CREATE INDEX IF NOT EXISTS ix_ticket_adjunto_ticket
ON tb_ticket_adjunto(tb_ticket_soporte_id,fecha_creacion);

UPDATE tb_submodulo SET sn_activo=FALSE WHERE codigo_submodulo='soporte_bandeja';
UPDATE tb_permiso SET sn_activo=FALSE WHERE codigo_permiso='soporte_bandeja.view';
