DROP FUNCTION IF EXISTS fn_evaluar_estado_nodo(INTEGER);

CREATE OR REPLACE FUNCTION fn_evaluar_estado_nodo(p_id_nodo INT)
RETURNS TABLE(p_estado_general VARCHAR,p_ultima_conexion TIMESTAMP,p_componentes JSONB)
LANGUAGE sql
AS $$
    WITH contexto AS (
        SELECT n.estado_energia,
            (SELECT MAX(b.fecha_hora) FROM tb_bitacora_auditoria b
             WHERE b.entidad='tb_nodo_iot' AND b.entidad_id=n.id
               AND b.valores_nuevos->>'estado_energia'='ENCENDIDO') AS fecha_encendido
        FROM tb_nodo_iot n WHERE n.id=p_id_nodo
    ), lecturas AS (
        SELECT sa.id sensor_id,sa.tipo_componente,COALESCE(sa.nombre,sa.tipo_componente) nombre,
            sa.unidad,sa.estado_operativo,sa.observacion_estado,
            actual.valor_lectura valor_actual,actual.fecha_hora ultima_conexion,
            anterior.valor_lectura valor_anterior,c.estado_energia,c.fecha_encendido
        FROM tb_sensor sa CROSS JOIN contexto c
        LEFT JOIN LATERAL (
            SELECT t.valor_lectura,t.fecha_hora FROM tb_telemetria t
            WHERE t.tb_sensor_id=sa.id ORDER BY t.fecha_hora DESC,t.id DESC LIMIT 1
        ) actual ON TRUE
        LEFT JOIN LATERAL (
            SELECT t.valor_lectura FROM tb_telemetria t
            WHERE t.tb_sensor_id=sa.id ORDER BY t.fecha_hora DESC,t.id DESC OFFSET 1 LIMIT 1
        ) anterior ON TRUE
        WHERE sa.tb_nodo_id=p_id_nodo AND sa.sn_activo=TRUE
    ), evaluados AS (
        SELECT *,CASE
            WHEN estado_energia='APAGADO' THEN 'SUSPENDIDO'
            WHEN estado_operativo='EN_REVISION' THEN 'EN_REVISION'
            WHEN estado_operativo='REQUIERE_REPARACION' THEN 'REQUIERE_REPARACION'
            WHEN fecha_encendido>=CURRENT_TIMESTAMP-INTERVAL '15 minutes'
                 AND (ultima_conexion IS NULL OR ultima_conexion<fecha_encendido) THEN 'ESPERANDO'
            WHEN ultima_conexion IS NULL THEN 'OFFLINE'
            WHEN EXTRACT(EPOCH FROM(CURRENT_TIMESTAMP-ultima_conexion))>1800 THEN 'OFFLINE'
            WHEN tipo_componente='BME280_TEMPERATURA_AMBIENTE' AND valor_actual NOT BETWEEN -40 AND 85 THEN 'ERROR'
            WHEN tipo_componente='BME280_HUMEDAD_RELATIVA' AND valor_actual NOT BETWEEN 0 AND 100 THEN 'ERROR'
            WHEN tipo_componente='BME280_PRESION_ATMOSFERICA' AND valor_actual NOT BETWEEN 300 AND 1100 THEN 'ERROR'
            WHEN tipo_componente ILIKE '%term%' AND valor_actual=-127.00 THEN 'ERROR'
            WHEN tipo_componente ILIKE '%term%' AND valor_anterior IS NOT NULL AND ABS(valor_actual-valor_anterior)>5 THEN 'WARNING'
            WHEN (tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%humedad_suelo%')
                 AND (valor_actual<=10 OR valor_actual>=1023) THEN 'ERROR'
            ELSE 'OK' END estado,
        CASE
            WHEN estado_energia='APAGADO' THEN 'Sin monitoreo porque el nodo fue apagado intencionalmente.'
            WHEN estado_operativo='EN_REVISION' THEN COALESCE(observacion_estado,'Sensor apartado para revision tecnica.')
            WHEN estado_operativo='REQUIERE_REPARACION' THEN COALESCE(observacion_estado,'Sensor apartado hasta completar la reparacion.')
            WHEN fecha_encendido>=CURRENT_TIMESTAMP-INTERVAL '15 minutes'
                 AND (ultima_conexion IS NULL OR ultima_conexion<fecha_encendido)
                THEN 'Esperando la primera lectura despues de encender el nodo (hasta 15 minutos).'
            WHEN ultima_conexion IS NULL THEN 'No hay datos registrados.'
            WHEN EXTRACT(EPOCH FROM(CURRENT_TIMESTAMP-ultima_conexion))>1800
                THEN 'Sin comunicacion hace '||ROUND(EXTRACT(EPOCH FROM(CURRENT_TIMESTAMP-ultima_conexion)))||' segundos.'
            WHEN tipo_componente='BME280_TEMPERATURA_AMBIENTE' AND valor_actual NOT BETWEEN -40 AND 85 THEN 'Temperatura ambiental fuera del rango fisico del BME280.'
            WHEN tipo_componente='BME280_HUMEDAD_RELATIVA' AND valor_actual NOT BETWEEN 0 AND 100 THEN 'Humedad relativa fuera del rango de 0 a 100 %.'
            WHEN tipo_componente='BME280_PRESION_ATMOSFERICA' AND valor_actual NOT BETWEEN 300 AND 1100 THEN 'Presion atmosferica fuera del rango esperado.'
            WHEN tipo_componente ILIKE '%term%' AND valor_actual=-127.00 THEN 'Cable de datos desconectado (-127).'
            WHEN tipo_componente ILIKE '%term%' AND valor_anterior IS NOT NULL AND ABS(valor_actual-valor_anterior)>5
                THEN 'Anomalia: salto de '||ABS(valor_actual-valor_anterior)||' detectado.'
            WHEN (tipo_componente ILIKE '%higr%' OR tipo_componente ILIKE '%humedad_suelo%')
                 AND (valor_actual<=10 OR valor_actual>=1023) THEN 'Posible cortocircuito o sensor fuera de tierra.'
            ELSE 'Operando con normalidad' END mensaje
        FROM lecturas
    )
    SELECT CASE
        WHEN COUNT(*)=0 THEN 'ERROR'
        WHEN BOOL_AND(estado='SUSPENDIDO') THEN 'SUSPENDIDO'
        WHEN BOOL_OR(estado IN('ERROR','OFFLINE')) THEN 'ERROR'
        WHEN BOOL_OR(estado IN('WARNING','EN_REVISION','REQUIERE_REPARACION')) THEN 'WARNING'
        WHEN BOOL_OR(estado='ESPERANDO') THEN 'ESPERANDO'
        ELSE 'OK' END::VARCHAR,
      MAX(ultima_conexion),
      COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
        'id',sensor_id,'tipoComponente',tipo_componente,'nombre',nombre,'unidad',unidad,
        'estado',estado,'estadoOperativo',estado_operativo,'mensaje',mensaje,
        'ultimaLectura',valor_actual,'ultimaConexion',ultima_conexion
      ) ORDER BY sensor_id) FILTER(WHERE sensor_id IS NOT NULL),'[]'::JSONB)
    FROM evaluados;
$$;
