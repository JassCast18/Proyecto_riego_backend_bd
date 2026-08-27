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

ALTER TABLE tb_notificacion DROP CONSTRAINT IF EXISTS ck_notificacion_severidad;
ALTER TABLE tb_notificacion DROP CONSTRAINT IF EXISTS ck_notificacion_estado;
UPDATE tb_notificacion SET severidad='CRITICAL' WHERE severidad='ERROR';
ALTER TABLE tb_notificacion
    ADD COLUMN IF NOT EXISTS persistencia_segundos INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fecha_primera_deteccion TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fecha_ultima_deteccion TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS ocurrencias INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS reconocida_por INT NULL REFERENCES tb_usuario(id),
    ADD COLUMN IF NOT EXISTS fecha_reconocimiento TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS fecha_correo_enviado TIMESTAMP NULL;
ALTER TABLE tb_notificacion
    ADD CONSTRAINT ck_notificacion_severidad CHECK (severidad IN ('INFO','WARNING','CRITICAL')),
    ADD CONSTRAINT ck_notificacion_estado CHECK (estado IN ('PENDIENTE','ACTIVA','RECONOCIDA','RESUELTA'));

ALTER TABLE tb_notificacion
ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id);

CREATE INDEX IF NOT EXISTS ix_notificacion_proyecto_fecha
ON tb_notificacion (tb_proyecto_id, fecha_actualizacion DESC);

DROP INDEX IF EXISTS uq_notificacion_evento_activo;
CREATE UNIQUE INDEX uq_notificacion_evento_activo
ON tb_notificacion (clave_evento)
WHERE estado IN ('PENDIENTE','ACTIVA','RECONOCIDA');

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

CREATE TABLE IF NOT EXISTS tb_notificacion_entrega (
    id BIGSERIAL PRIMARY KEY,
    tb_notificacion_id BIGINT NOT NULL REFERENCES tb_notificacion(id) ON DELETE CASCADE,
    tb_usuario_id INT NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
    canal VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    intentos INT NOT NULL DEFAULT 0,
    ultimo_error VARCHAR(500),
    fecha_ultimo_intento TIMESTAMP,
    fecha_envio TIMESTAMP,
    CONSTRAINT uq_notificacion_entrega UNIQUE(tb_notificacion_id,tb_usuario_id,canal),
    CONSTRAINT ck_notificacion_entrega_canal CHECK(canal IN ('EMAIL')),
    CONSTRAINT ck_notificacion_entrega_estado CHECK(estado IN ('PENDIENTE','ENVIADO','FALLIDO'))
);
