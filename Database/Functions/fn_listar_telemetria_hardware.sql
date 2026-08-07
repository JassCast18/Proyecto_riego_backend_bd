DROP FUNCTION IF EXISTS fn_listar_telemetria_hardware(INT, INT, INT);
DROP FUNCTION IF EXISTS fn_listar_telemetria_hardware(INT, INT, INT, INT);

CREATE OR REPLACE FUNCTION fn_listar_telemetria_hardware(
    p_proyecto_id INT,
    p_id_nodo INT DEFAULT NULL,
    p_limite INT DEFAULT 15,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    id BIGINT,
    tb_sensor_id INT,
    tb_nodo_id INT,
    tipo_componente VARCHAR,
    valor_lectura DECIMAL,
    fecha_hora TIMESTAMP,
    total_registros BIGINT
)
LANGUAGE sql
AS $$
    WITH filtrada AS (
        SELECT t.id, t.tb_sensor_id, sa.tb_nodo_id, sa.tipo_componente,
               t.valor_lectura, t.fecha_hora, COUNT(*) OVER() AS total_registros
        FROM tb_telemetria t
        INNER JOIN tb_sensor_actuador sa ON sa.id = t.tb_sensor_id
        INNER JOIN tb_nodo_iot n ON n.id = sa.tb_nodo_id
        INNER JOIN tb_sector s ON s.id = n.tb_sector_id
        INNER JOIN tb_finca f ON f.id = s.tb_finca_id
        WHERE f.tb_proyecto_id = p_proyecto_id
          AND (p_id_nodo IS NULL OR sa.tb_nodo_id = p_id_nodo)
    )
    SELECT id, tb_sensor_id, tb_nodo_id, tipo_componente, valor_lectura,
           fecha_hora, total_registros
    FROM filtrada
    ORDER BY fecha_hora DESC, id DESC
    LIMIT GREATEST(p_limite, 1)
    OFFSET GREATEST(p_offset, 0);
$$;
