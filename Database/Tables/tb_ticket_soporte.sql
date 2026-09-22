-- =========================================================================
-- Nombre: tb_ticket_soporte
-- Primary_Key: id
-- Desciprion: Tabla para informacion con soporte
--=========================================================================
CREATE TABLE IF NOT EXISTS tb_ticket_soporte (
    id SERIAL PRIMARY KEY,
    tb_usuario_id INT REFERENCES tb_usuario(id),
    asunto VARCHAR(150) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'NUEVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE tb_ticket_soporte
    ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) NOT NULL DEFAULT 'OTRO',
    ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    ADD COLUMN IF NOT EXISTS jira_issue_id VARCHAR(40),
    ADD COLUMN IF NOT EXISTS jira_issue_key VARCHAR(40),
    ADD COLUMN IF NOT EXISTS jira_estado VARCHAR(80),
    ADD COLUMN IF NOT EXISTS estado_sincronizacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN IF NOT EXISTS intentos_sincronizacion INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ultimo_error_sincronizacion VARCHAR(800),
    ADD COLUMN IF NOT EXISTS fecha_ultima_sincronizacion TIMESTAMP,
    ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP;

ALTER TABLE tb_ticket_soporte ALTER COLUMN fecha_creacion SET DEFAULT NOW();
ALTER TABLE tb_ticket_soporte ALTER COLUMN estado SET DEFAULT 'NUEVO';
UPDATE tb_ticket_soporte SET descripcion='' WHERE descripcion IS NULL;
UPDATE tb_ticket_soporte SET estado=CASE
    WHEN upper(estado) IN ('NUEVO','EN_REVISION','EN_PROGRESO','ESPERANDO_USUARIO','RESUELTO','CERRADO') THEN upper(estado)
    ELSE 'NUEVO' END;

ALTER TABLE tb_ticket_soporte DROP CONSTRAINT IF EXISTS ck_ticket_soporte_estado;
ALTER TABLE tb_ticket_soporte DROP CONSTRAINT IF EXISTS ck_ticket_soporte_categoria;
ALTER TABLE tb_ticket_soporte DROP CONSTRAINT IF EXISTS ck_ticket_soporte_prioridad;
ALTER TABLE tb_ticket_soporte DROP CONSTRAINT IF EXISTS ck_ticket_soporte_sincronizacion;
ALTER TABLE tb_ticket_soporte
    ADD CONSTRAINT ck_ticket_soporte_estado CHECK (estado IN ('NUEVO','EN_REVISION','EN_PROGRESO','ESPERANDO_USUARIO','RESUELTO','CERRADO')),
    ADD CONSTRAINT ck_ticket_soporte_categoria CHECK (categoria IN ('HARDWARE','TELEMETRIA','RIEGO','IA','USUARIOS','REPORTES','OTRO')),
    ADD CONSTRAINT ck_ticket_soporte_prioridad CHECK (prioridad IN ('BAJA','MEDIA','ALTA','CRITICA')),
    ADD CONSTRAINT ck_ticket_soporte_sincronizacion CHECK (estado_sincronizacion IN ('PENDIENTE','SINCRONIZADO','ERROR'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_soporte_jira_key
ON tb_ticket_soporte(jira_issue_key) WHERE jira_issue_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_ticket_soporte_proyecto_fecha
ON tb_ticket_soporte(tb_proyecto_id,fecha_actualizacion DESC);
CREATE INDEX IF NOT EXISTS ix_ticket_soporte_usuario_fecha
ON tb_ticket_soporte(tb_usuario_id,fecha_actualizacion DESC);

CREATE TABLE IF NOT EXISTS tb_ticket_comentario (
    id BIGSERIAL PRIMARY KEY,
    tb_ticket_soporte_id INT NOT NULL REFERENCES tb_ticket_soporte(id) ON DELETE CASCADE,
    tb_usuario_id INT REFERENCES tb_usuario(id),
    jira_comment_id VARCHAR(50),
    mensaje TEXT NOT NULL,
    origen VARCHAR(20) NOT NULL DEFAULT 'USUARIO',
    publico BOOLEAN NOT NULL DEFAULT TRUE,
    estado_sincronizacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_ticket_comentario_origen CHECK (origen IN ('USUARIO','SOPORTE','JIRA','SISTEMA')),
    CONSTRAINT ck_ticket_comentario_sync CHECK (estado_sincronizacion IN ('PENDIENTE','SINCRONIZADO','ERROR'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_comentario_jira
ON tb_ticket_comentario(jira_comment_id) WHERE jira_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_ticket_comentario_ticket_fecha
ON tb_ticket_comentario(tb_ticket_soporte_id,fecha_creacion);

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

CREATE TABLE IF NOT EXISTS tb_ticket_evento (
    id BIGSERIAL PRIMARY KEY,
    tb_ticket_soporte_id INT NOT NULL REFERENCES tb_ticket_soporte(id) ON DELETE CASCADE,
    tb_usuario_id INT REFERENCES tb_usuario(id),
    tipo VARCHAR(30) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_ticket_evento_ticket_fecha
ON tb_ticket_evento(tb_ticket_soporte_id,fecha_creacion);

CREATE TABLE IF NOT EXISTS tb_faq_soporte (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(30) NOT NULL,
    pregunta VARCHAR(180) NOT NULL,
    respuesta TEXT NOT NULL,
    palabras_clave VARCHAR(300),
    orden INT NOT NULL DEFAULT 0,
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO tb_faq_soporte(slug,categoria,pregunta,respuesta,palabras_clave,orden)
VALUES
('telemetria-sin-datos','TELEMETRIA','¿Por qué no aparecen datos de telemetría?','Verifica que el nodo esté encendido, calibrado y habilitado para telemetría. Durante una prueba técnica o una reparación, las lecturas del sensor involucrado pueden omitirse.','telemetria nodo lecturas datos sensor',1),
('sensor-reparacion','HARDWARE','¿Qué ocurre con un sensor en reparación?','El nodo puede continuar trabajando con los demás sensores. El sensor marcado para reparación se excluye de alertas, decisiones automáticas y validaciones de calibración hasta completar su mantenimiento.','sensor reparacion mantenimiento ignorar',2),
('calibracion-humedad','HARDWARE','¿Cómo calibro un sensor de humedad?','Apaga el nodo desde Calibración, captura varias lecturas en tierra seca y luego en tierra completamente mojada. Al guardar ambos puntos podrás volver a habilitar el nodo.','calibracion humedad seco mojado',3),
('riego-no-inicia','RIEGO','¿Por qué no inicia un riego?','Comprueba que no exista otro riego o prueba activa, que el actuador esté disponible y que el motor de decisión configurado permita iniciar el proceso.','riego actuador activo prueba',4),
('ia-supervisada','IA','¿Qué significa que la IA esté en modo supervisado?','La IA genera recomendaciones, pero una persona debe aceptar o rechazar cada decisión antes de modificar el riego.','ia supervisado decision aceptar rechazar',5),
('ia-entrenamiento','IA','¿Cuándo debo entrenar nuevamente el modelo?','Entrena una nueva versión cuando existan suficientes decisiones revisadas o cuando necesites volver a un punto histórico confiable. El historial original permanece disponible para auditoría.','ia entrenar modelo version historial',6),
('notificaciones','USUARIOS','¿Quién puede ver una notificación reconocida?','Las notificaciones normales se muestran según el proyecto y el usuario. Una alerta crítica reconocida continúa visible para el propietario hasta que se resuelva.','notificacion reconocida critica propietario',7),
('crear-ticket','OTRO','¿Qué información debo incluir en un ticket?','Describe lo que intentabas hacer, el resultado obtenido y los pasos para reproducirlo. Selecciona la categoría y el impacto correctos para facilitar la revisión.','ticket soporte error pasos',8)
ON CONFLICT(slug) DO UPDATE SET
categoria=EXCLUDED.categoria,pregunta=EXCLUDED.pregunta,respuesta=EXCLUDED.respuesta,
palabras_clave=EXCLUDED.palabras_clave,orden=EXCLUDED.orden,sn_activo=TRUE,fecha_actualizacion=NOW();
