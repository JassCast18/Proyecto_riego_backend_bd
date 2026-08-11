CREATE TABLE IF NOT EXISTS tb_ciclo_cultivo (
    id SERIAL PRIMARY KEY,
    tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    numero_ciclo INT NOT NULL,
    tb_cultivo_id INT NOT NULL REFERENCES tb_cultivo(id),
    variedad VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    tiempo_cosecha_estimado_dias INT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    cod_usuario_registro INT REFERENCES tb_usuario(id),
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ciclo_cultivo_proyecto UNIQUE(tb_proyecto_id,numero_ciclo),
    CONSTRAINT ck_ciclo_cultivo_estado CHECK(estado IN ('ACTIVO','FINALIZADO','CANCELADO'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ciclo_activo_proyecto
ON tb_ciclo_cultivo(tb_proyecto_id) WHERE estado='ACTIVO';

ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS fecha_primer_brote DATE;
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS porcentaje_brote DECIMAL(5,2);
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS resultado_final VARCHAR(30);
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS cantidad_cosechada DECIMAL(14,2);
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS unidad_cosecha VARCHAR(30);
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS calidad_cosecha VARCHAR(30);
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS observaciones_cierre TEXT;
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS cod_usuario_cierre INT REFERENCES tb_usuario(id);
ALTER TABLE tb_ciclo_cultivo ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP;

INSERT INTO tb_ciclo_cultivo(
    tb_proyecto_id,numero_ciclo,tb_cultivo_id,variedad,fecha_inicio,
    tiempo_cosecha_estimado_dias,estado,cod_usuario_registro,fecha_registra
)
SELECT pc.tb_proyecto_id,1,pc.tb_cultivo_id,pc.variedad,pc.fecha_siembra,
       pc.tiempo_cosecha_dias,'ACTIVO',pc.cod_usuario_registro,pc.fecha_registra
FROM tb_proyecto_cultivo pc
WHERE NOT EXISTS(SELECT 1 FROM tb_ciclo_cultivo c WHERE c.tb_proyecto_id=pc.tb_proyecto_id);
