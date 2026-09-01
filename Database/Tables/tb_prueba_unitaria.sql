CREATE TABLE IF NOT EXISTS tb_prueba_unitaria (
    id SERIAL PRIMARY KEY,
    tb_proyecto_id INT REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    tb_nodo_id INT REFERENCES tb_nodo_iot(id),
    tb_usuario_id INT REFERENCES tb_usuario(id),
    tipo_prueba VARCHAR(20) NOT NULL DEFAULT 'SENSOR',
    tb_sensor_id INT REFERENCES tb_sensor(id),
    tb_actuador_id INT REFERENCES tb_actuador(id),
    objetivo VARCHAR(300),
    intervalo_segundos INT NOT NULL DEFAULT 10,
    duracion_segundos INT NOT NULL DEFAULT 120,
    estado VARCHAR(20) NOT NULL DEFAULT 'CREADA',
    resultado VARCHAR(30),
    conclusion VARCHAR(1000),
    is_test BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    ultima_comunicacion TIMESTAMP
);

ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id) ON DELETE CASCADE;
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS tipo_prueba VARCHAR(20) NOT NULL DEFAULT 'SENSOR';
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS tb_sensor_id INT REFERENCES tb_sensor(id);
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS tb_actuador_id INT REFERENCES tb_actuador(id);
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS objetivo VARCHAR(300);
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS intervalo_segundos INT NOT NULL DEFAULT 10;
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS duracion_segundos INT NOT NULL DEFAULT 120;
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'CREADA';
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS resultado VARCHAR(30);
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS conclusion VARCHAR(1000);
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP;
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP;
ALTER TABLE tb_prueba_unitaria ADD COLUMN IF NOT EXISTS ultima_comunicacion TIMESTAMP;
ALTER TABLE tb_prueba_unitaria ALTER COLUMN fecha_hora SET DEFAULT NOW();
ALTER TABLE tb_prueba_unitaria ALTER COLUMN is_test SET DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS tb_prueba_lectura (
    id BIGSERIAL PRIMARY KEY,
    tb_prueba_id INT NOT NULL REFERENCES tb_prueba_unitaria(id) ON DELETE CASCADE,
    tb_sensor_id INT NOT NULL REFERENCES tb_sensor(id),
    valor_lectura DECIMAL NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_comando_iot (
    id BIGSERIAL PRIMARY KEY,
    tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    tb_nodo_id INT NOT NULL REFERENCES tb_nodo_iot(id) ON DELETE CASCADE,
    tb_prueba_id INT REFERENCES tb_prueba_unitaria(id) ON DELETE CASCADE,
    tipo_comando VARCHAR(30) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    intentos INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_entrega TIMESTAMP,
    fecha_confirmacion TIMESTAMP,
    mensaje_confirmacion VARCHAR(300),
    fecha_expiracion TIMESTAMP NOT NULL DEFAULT NOW()+INTERVAL '5 minutes',
    CONSTRAINT ck_comando_estado CHECK(estado IN ('PENDIENTE','ENTREGADO','CONFIRMADO','FALLIDO','EXPIRADO'))
);

CREATE INDEX IF NOT EXISTS ix_prueba_proyecto_fecha ON tb_prueba_unitaria(tb_proyecto_id,fecha_hora DESC);
CREATE INDEX IF NOT EXISTS ix_prueba_lectura_prueba ON tb_prueba_lectura(tb_prueba_id,fecha_hora);
CREATE INDEX IF NOT EXISTS ix_comando_nodo_estado ON tb_comando_iot(tb_nodo_id,estado,fecha_creacion);
