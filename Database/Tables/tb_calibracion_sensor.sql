CREATE TABLE IF NOT EXISTS tb_calibracion_sensor (
    id BIGSERIAL PRIMARY KEY,
    tb_sensor_id INT NOT NULL REFERENCES tb_sensor(id) ON DELETE CASCADE,
    tb_prueba_id INT REFERENCES tb_prueba_unitaria(id) ON DELETE SET NULL,
    tb_usuario_id INT NOT NULL REFERENCES tb_usuario(id),
    adc_seco DECIMAL(10,2) NOT NULL,
    adc_humedo DECIMAL(10,2) NOT NULL,
    fecha_calibracion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_calibracion_sensor_rango CHECK(adc_seco > adc_humedo AND adc_seco-adc_humedo >= 50)
);

CREATE INDEX IF NOT EXISTS ix_calibracion_sensor_fecha
ON tb_calibracion_sensor(tb_sensor_id,fecha_calibracion DESC);
