CREATE TABLE IF NOT EXISTS tb_ciclo_riego(
  id BIGSERIAL PRIMARY KEY,
  tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
  tb_nodo_id INT NOT NULL REFERENCES tb_nodo_iot(id) ON DELETE CASCADE,
  tb_sensor_id INT NOT NULL REFERENCES tb_sensor(id),
  tb_actuador_id INT NOT NULL REFERENCES tb_actuador(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  humedad_inicio DECIMAL(8,2) NOT NULL,
  humedad_fin DECIMAL(8,2),
  fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMP,
  motivo_cierre VARCHAR(200),
  CONSTRAINT ck_ciclo_riego_estado CHECK(estado IN('ACTIVO','FINALIZADO'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ciclo_riego_nodo_activo ON tb_ciclo_riego(tb_nodo_id) WHERE estado='ACTIVO';
CREATE INDEX IF NOT EXISTS ix_ciclo_riego_proyecto_fecha ON tb_ciclo_riego(tb_proyecto_id,fecha_inicio DESC);
