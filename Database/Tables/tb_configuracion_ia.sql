CREATE TABLE IF NOT EXISTS tb_configuracion_ia(
 tb_proyecto_id INT PRIMARY KEY REFERENCES tb_proyecto(id) ON DELETE CASCADE,
 estrategia_decision VARCHAR(20) NOT NULL DEFAULT 'IA',
 modo VARCHAR(20) NOT NULL DEFAULT 'SUPERVISADO',
 intervalo_evaluacion_minutos INT NOT NULL DEFAULT 5,
 duracion_riego_segundos INT NOT NULL DEFAULT 30,
 exactitud_minima DECIMAL(5,4) NOT NULL DEFAULT 0.8000,
 confirmaciones_minimas INT NOT NULL DEFAULT 5,
 ultima_evaluacion TIMESTAMP,
 cod_usuario_modifica INT REFERENCES tb_usuario(id),
 fecha_modifica TIMESTAMP NOT NULL DEFAULT NOW(),
 CONSTRAINT ck_config_ia_modo CHECK(modo IN('SUPERVISADO','AUTOMATICO')),
 CONSTRAINT ck_config_ia_estrategia CHECK(estrategia_decision IN('UMBRAL','IA')),
 CONSTRAINT ck_config_ia_intervalo CHECK(intervalo_evaluacion_minutos BETWEEN 1 AND 60),
 CONSTRAINT ck_config_ia_duracion CHECK(duracion_riego_segundos BETWEEN 10 AND 600),
 CONSTRAINT ck_config_ia_exactitud CHECK(exactitud_minima BETWEEN 0.50 AND 1),
 CONSTRAINT ck_config_ia_confirmaciones CHECK(confirmaciones_minimas BETWEEN 3 AND 100)
);
INSERT INTO tb_configuracion_ia(tb_proyecto_id) SELECT id FROM tb_proyecto ON CONFLICT DO NOTHING;
ALTER TABLE tb_configuracion_ia ADD COLUMN IF NOT EXISTS estrategia_decision VARCHAR(20) NOT NULL DEFAULT 'IA';
ALTER TABLE tb_configuracion_ia DROP CONSTRAINT IF EXISTS ck_config_ia_estrategia;
ALTER TABLE tb_configuracion_ia ADD CONSTRAINT ck_config_ia_estrategia CHECK(estrategia_decision IN('UMBRAL','IA'));
