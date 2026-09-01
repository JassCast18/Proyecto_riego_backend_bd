DO $$
BEGIN
    IF to_regclass('public.tb_sensor') IS NULL AND to_regclass('public.tb_sensor_actuador') IS NOT NULL THEN
        ALTER TABLE tb_sensor_actuador RENAME TO tb_sensor;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS tb_sensor (
    id SERIAL PRIMARY KEY,
    tb_nodo_id INT NOT NULL REFERENCES tb_nodo_iot(id) ON DELETE CASCADE,
    tipo_componente VARCHAR(50) NOT NULL,
    nombre VARCHAR(100),
    unidad VARCHAR(20),
    recomendacion_prueba VARCHAR(500),
    sn_activo BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE tb_sensor ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE tb_sensor ADD COLUMN IF NOT EXISTS unidad VARCHAR(20);
ALTER TABLE tb_sensor ADD COLUMN IF NOT EXISTS recomendacion_prueba VARCHAR(500);
ALTER TABLE tb_sensor ADD COLUMN IF NOT EXISTS sn_activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tb_sensor ALTER COLUMN tb_nodo_id SET NOT NULL;

UPDATE tb_sensor SET
  nombre=COALESCE(nombre,tipo_componente),
  unidad=COALESCE(unidad,CASE WHEN tipo_componente ILIKE '%term%' THEN '°C' WHEN tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%hum%' THEN 'ADC' END),
  recomendacion_prueba=COALESCE(recomendacion_prueba,CASE
    WHEN tipo_componente ILIKE '%term%' THEN 'Compara la lectura con un termómetro de referencia y evita calentar directamente el sensor.'
    WHEN tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%hum%' THEN 'Registra una lectura en tierra seca, aplica agua gradualmente y verifica un cambio estable.'
    ELSE 'Provoca un cambio controlado en la magnitud medida y compáralo con una referencia.' END);

CREATE INDEX IF NOT EXISTS ix_sensor_nodo ON tb_sensor(tb_nodo_id,sn_activo);
