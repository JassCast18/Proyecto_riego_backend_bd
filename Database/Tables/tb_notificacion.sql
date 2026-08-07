-- Notificaciones del sistema: globales cuando tb_rol_id es NULL o dirigidas a un rol.
CREATE TABLE IF NOT EXISTS tb_notificacion (
    id BIGSERIAL PRIMARY KEY,
    clave_evento VARCHAR(150),
    tb_rol_id INT NULL REFERENCES tb_rol(id),
    tb_nodo_id INT NULL REFERENCES tb_nodo_iot(id),
    categoria VARCHAR(40) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    severidad VARCHAR(20) NOT NULL DEFAULT 'INFO',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    descartable BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_resolucion TIMESTAMP NULL,
    CONSTRAINT ck_notificacion_severidad CHECK (severidad IN ('INFO', 'WARNING', 'ERROR')),
    CONSTRAINT ck_notificacion_estado CHECK (estado IN ('ACTIVA', 'RESUELTA'))
);

ALTER TABLE tb_notificacion
ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id);

CREATE INDEX IF NOT EXISTS ix_notificacion_proyecto_fecha
ON tb_notificacion (tb_proyecto_id, fecha_actualizacion DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notificacion_evento_activo
ON tb_notificacion (clave_evento)
WHERE estado = 'ACTIVA';

CREATE INDEX IF NOT EXISTS ix_notificacion_destino_fecha
ON tb_notificacion (tb_rol_id, fecha_creacion DESC);

CREATE TABLE IF NOT EXISTS tb_notificacion_usuario (
    tb_notificacion_id BIGINT NOT NULL REFERENCES tb_notificacion(id) ON DELETE CASCADE,
    tb_usuario_id INT NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
    revisada BOOLEAN NOT NULL DEFAULT FALSE,
    descartada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_revision TIMESTAMP NULL,
    fecha_descarte TIMESTAMP NULL,
    PRIMARY KEY (tb_notificacion_id, tb_usuario_id)
);
