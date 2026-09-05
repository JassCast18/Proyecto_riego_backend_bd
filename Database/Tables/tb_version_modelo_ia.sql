-- =========================================================================
-- Nombre: tb_version_modelo_ia
-- Primary_Key: id
-- Desciprion: Tabla para informacion sobre versionado de ia
--=========================================================================
DO $$
DECLARE v_exists BOOLEAN; v_has_data BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tb_version_modelo_ia') INTO v_exists;
    IF v_exists THEN
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM tb_version_modelo_ia LIMIT 1)' INTO v_has_data;
        IF NOT v_has_data THEN
            DROP TABLE tb_version_modelo_ia CASCADE;
            v_exists := FALSE;
        END IF;
    END IF;
    IF NOT v_exists THEN
        CREATE TABLE tb_version_modelo_ia (
            id SERIAL PRIMARY KEY,
            tb_usuario_id INT REFERENCES tb_usuario(id),
            ruta_pesos_algoritmo VARCHAR(255) NOT NULL,
            sn_activo BOOLEAN NOT NULL
        );
    END IF;
END $$;

ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS tb_proyecto_id INT REFERENCES tb_proyecto(id) ON DELETE CASCADE;
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS version VARCHAR(80);
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS algoritmo VARCHAR(80) NOT NULL DEFAULT 'RandomForestClassifier';
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NOT NULL DEFAULT 'ENTRENADO';
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS total_muestras INT NOT NULL DEFAULT 0;
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS exactitud DECIMAL(7,5);
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS precision_modelo DECIMAL(7,5);
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS sensibilidad DECIMAL(7,5);
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS importancia_variables JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE tb_version_modelo_ia ADD COLUMN IF NOT EXISTS fecha_entrenamiento TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE tb_version_modelo_ia ALTER COLUMN ruta_pesos_algoritmo DROP NOT NULL;
ALTER TABLE tb_version_modelo_ia ALTER COLUMN sn_activo SET DEFAULT FALSE;
ALTER TABLE tb_version_modelo_ia DROP CONSTRAINT IF EXISTS ck_modelo_ia_estado;
UPDATE tb_version_modelo_ia SET estado=CASE WHEN sn_activo THEN 'EN_REVISION' ELSE 'RETIRADO' END WHERE estado NOT IN('EN_REVISION','VALIDADO','RETIRADO');
ALTER TABLE tb_version_modelo_ia ADD CONSTRAINT ck_modelo_ia_estado CHECK(estado IN('EN_REVISION','VALIDADO','RETIRADO'));
ALTER TABLE tb_version_modelo_ia ALTER COLUMN estado SET DEFAULT 'EN_REVISION';
CREATE INDEX IF NOT EXISTS ix_modelo_ia_proyecto_fecha ON tb_version_modelo_ia(tb_proyecto_id,fecha_entrenamiento DESC);

CREATE TABLE IF NOT EXISTS tb_decision_ia(
  id BIGSERIAL PRIMARY KEY,
  tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
  tb_nodo_id INT REFERENCES tb_nodo_iot(id),
  tb_version_modelo_id INT REFERENCES tb_version_modelo_ia(id),
  decision VARCHAR(30) NOT NULL,
  confianza DECIMAL(7,5),
  modo VARCHAR(20) NOT NULL DEFAULT 'OBSERVACION',
  variables_entrada JSONB NOT NULL,
  explicacion VARCHAR(500),
  ejecutada BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_decision_ia_decision CHECK(decision IN('REGAR','NO_REGAR')),
  CONSTRAINT ck_decision_ia_modo CHECK(modo IN('OBSERVACION','AUTOMATICO'))
);
CREATE INDEX IF NOT EXISTS ix_decision_ia_proyecto_fecha ON tb_decision_ia(tb_proyecto_id,fecha_hora DESC);
ALTER TABLE tb_decision_ia ADD COLUMN IF NOT EXISTS estado VARCHAR(25) NOT NULL DEFAULT 'REGISTRADA';
ALTER TABLE tb_decision_ia ADD COLUMN IF NOT EXISTS tb_usuario_resuelve_id INT REFERENCES tb_usuario(id);
ALTER TABLE tb_decision_ia ADD COLUMN IF NOT EXISTS tb_actuador_id INT REFERENCES tb_actuador(id);
ALTER TABLE tb_decision_ia ADD COLUMN IF NOT EXISTS duracion_segundos INT;
ALTER TABLE tb_decision_ia ADD COLUMN IF NOT EXISTS observacion_resolucion VARCHAR(500);
ALTER TABLE tb_decision_ia ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMP;
ALTER TABLE tb_decision_ia DROP CONSTRAINT IF EXISTS ck_decision_ia_estado;
ALTER TABLE tb_decision_ia ADD CONSTRAINT ck_decision_ia_estado CHECK(estado IN('PENDIENTE','REGISTRADA','ACEPTADA','RECHAZADA','COMPLETADA','CANCELADA'));
UPDATE tb_decision_ia SET estado='PENDIENTE' WHERE decision='REGAR' AND NOT ejecutada AND estado='REGISTRADA';
ALTER TABLE tb_ciclo_riego ADD COLUMN IF NOT EXISTS tb_decision_ia_id BIGINT REFERENCES tb_decision_ia(id);
