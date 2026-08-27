DROP PROCEDURE IF EXISTS sp_sincronizar_notificaciones_hardware(JSONB);
DROP PROCEDURE IF EXISTS sp_sincronizar_notificaciones_hardware(INT, JSONB);

CREATE OR REPLACE PROCEDURE sp_sincronizar_notificaciones_hardware(
    IN p_proyecto_id INT,
    IN p_incidentes JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_incidente JSONB;
    v_claves_detectadas VARCHAR[] := ARRAY[]::VARCHAR[];
BEGIN
    FOR v_incidente IN
        SELECT value FROM jsonb_array_elements(COALESCE(p_incidentes, '[]'::JSONB))
    LOOP
        v_claves_detectadas := array_append(v_claves_detectadas, v_incidente->>'key');

        INSERT INTO tb_notificacion (
            clave_evento,tb_proyecto_id,tb_nodo_id,categoria,tipo,titulo,mensaje,
            severidad,estado,descartable,persistencia_segundos,
            fecha_primera_deteccion,fecha_ultima_deteccion,ocurrencias
        ) VALUES (
            v_incidente->>'key',p_proyecto_id,(v_incidente->>'nodeId')::INT,
            COALESCE(v_incidente->>'category','HARDWARE'),v_incidente->>'type',
            v_incidente->>'title',v_incidente->>'message',v_incidente->>'severity',
            'PENDIENTE',COALESCE((v_incidente->>'dismissible')::BOOLEAN,FALSE),
            COALESCE((v_incidente->>'persistenceSeconds')::INT,0),NOW(),NOW(),1
        )
        ON CONFLICT (clave_evento) WHERE estado IN ('PENDIENTE','ACTIVA','RECONOCIDA')
        DO UPDATE SET
            titulo=EXCLUDED.titulo,mensaje=EXCLUDED.mensaje,severidad=EXCLUDED.severidad,
            descartable=EXCLUDED.descartable,persistencia_segundos=EXCLUDED.persistencia_segundos,
            fecha_ultima_deteccion=NOW(),fecha_actualizacion=NOW(),
            ocurrencias=tb_notificacion.ocurrencias+1;
    END LOOP;

    UPDATE tb_notificacion
    SET estado='ACTIVA',fecha_actualizacion=NOW()
    WHERE tb_proyecto_id=p_proyecto_id AND estado='PENDIENTE'
      AND clave_evento=ANY(v_claves_detectadas)
      AND EXTRACT(EPOCH FROM (clock_timestamp()-fecha_primera_deteccion))>=persistencia_segundos;

    -- Las detecciones transitorias no contaminan el historial.
    DELETE FROM tb_notificacion
    WHERE tb_proyecto_id=p_proyecto_id AND estado='PENDIENTE'
      AND NOT (clave_evento=ANY(v_claves_detectadas));

    UPDATE tb_notificacion
    SET estado='RESUELTA',fecha_resolucion=NOW(),fecha_actualizacion=NOW()
    WHERE tb_proyecto_id=p_proyecto_id
      AND estado IN ('ACTIVA','RECONOCIDA')
      AND categoria IN ('HARDWARE','CULTIVO')
      AND NOT (clave_evento=ANY(v_claves_detectadas));
END;
$$;
