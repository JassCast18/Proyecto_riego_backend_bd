DROP FUNCTION IF EXISTS fn_evaluar_estado_nodo(INTEGER);

CREATE OR REPLACE FUNCTION fn_evaluar_estado_nodo(p_id_nodo INT)
RETURNS TABLE(
    p_estado_general VARCHAR,
    p_ultima_conexion TIMESTAMP,
    p_componentes JSONB
)
LANGUAGE sql
AS $$
    WITH lecturas AS (
        SELECT
            sa.id AS sensor_id,
            sa.tipo_componente,
            sa.estado_operativo,
            sa.observacion_estado,
            actual.valor_lectura AS valor_actual,
            actual.fecha_hora AS ultima_conexion,
            anterior.valor_lectura AS valor_anterior
        FROM tb_sensor sa
        LEFT JOIN LATERAL (
            SELECT t.valor_lectura, t.fecha_hora
            FROM tb_telemetria t
            WHERE t.tb_sensor_id = sa.id
            ORDER BY t.fecha_hora DESC, t.id DESC
            LIMIT 1
        ) actual ON TRUE
        LEFT JOIN LATERAL (
            SELECT t.valor_lectura
            FROM tb_telemetria t
            WHERE t.tb_sensor_id = sa.id
            ORDER BY t.fecha_hora DESC, t.id DESC
            OFFSET 1 LIMIT 1
        ) anterior ON TRUE
        WHERE sa.tb_nodo_id = p_id_nodo
    ), evaluados AS (
        SELECT
            *,
            CASE
                WHEN estado_operativo='EN_REVISION' THEN 'EN_REVISION'
                WHEN estado_operativo='REQUIERE_REPARACION' THEN 'REQUIERE_REPARACION'
                WHEN ultima_conexion IS NULL THEN 'OFFLINE'
                WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ultima_conexion)) > 75 THEN 'OFFLINE'
                WHEN tipo_componente ILIKE '%term%' AND valor_actual = -127.00 THEN 'ERROR'
                WHEN tipo_componente ILIKE '%term%' AND valor_anterior IS NOT NULL
                     AND ABS(valor_actual - valor_anterior) > 5 THEN 'WARNING'
                WHEN (tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%hum%')
                     AND (valor_actual <= 10 OR valor_actual >= 1023) THEN 'ERROR'
                ELSE 'OK'
            END AS estado,
            CASE
                WHEN estado_operativo='EN_REVISION' THEN COALESCE(observacion_estado,'Sensor apartado para revisión técnica.')
                WHEN estado_operativo='REQUIERE_REPARACION' THEN COALESCE(observacion_estado,'Sensor apartado hasta completar la reparación.')
                WHEN ultima_conexion IS NULL THEN 'No hay datos registrados.'
                WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ultima_conexion)) > 75
                    THEN 'Sin comunicacion hace ' || ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ultima_conexion))) || ' segundos.'
                WHEN tipo_componente ILIKE '%term%' AND valor_actual = -127.00
                    THEN 'Cable de datos desconectado (-127).'
                WHEN tipo_componente ILIKE '%term%' AND valor_anterior IS NOT NULL
                     AND ABS(valor_actual - valor_anterior) > 5
                    THEN 'Anomalia: salto de ' || ABS(valor_actual - valor_anterior) || ' detectado.'
                WHEN (tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%hum%')
                     AND (valor_actual <= 10 OR valor_actual >= 1023)
                    THEN 'Posible cortocircuito o sensor fuera de tierra.'
                ELSE 'Operando con normalidad'
            END AS mensaje
        FROM lecturas
    )
    SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 'ERROR'
            WHEN BOOL_OR(estado IN ('ERROR', 'OFFLINE')) THEN 'ERROR'
            WHEN BOOL_OR(estado IN ('WARNING','EN_REVISION','REQUIERE_REPARACION')) THEN 'WARNING'
            ELSE 'OK'
        END::VARCHAR,
        MAX(ultima_conexion),
        COALESCE(
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id', sensor_id,
                    'tipoComponente', tipo_componente,
                    'estado', estado,
                    'estadoOperativo',estado_operativo,
                    'mensaje', mensaje,
                    'ultimaLectura', valor_actual,
                    'ultimaConexion', ultima_conexion
                ) ORDER BY sensor_id
            ) FILTER (WHERE sensor_id IS NOT NULL),
            '[]'::JSONB
        )
    FROM evaluados;
$$;
