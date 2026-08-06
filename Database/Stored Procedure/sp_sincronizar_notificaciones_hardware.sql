CREATE OR REPLACE PROCEDURE sp_sincronizar_notificaciones_hardware(
    IN p_incidentes JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_incidente JSONB;
    v_claves_activas VARCHAR[] := ARRAY[]::VARCHAR[];
BEGIN
    FOR v_incidente IN
        SELECT value FROM jsonb_array_elements(COALESCE(p_incidentes, '[]'::JSONB))
    LOOP
        v_claves_activas := array_append(v_claves_activas, v_incidente->>'key');

        INSERT INTO tb_notificacion (
            clave_evento,
            tb_nodo_id,
            categoria,
            tipo,
            titulo,
            mensaje,
            severidad,
            descartable
        )
        VALUES (
            v_incidente->>'key',
            (v_incidente->>'nodeId')::INT,
            'HARDWARE',
            v_incidente->>'type',
            v_incidente->>'title',
            v_incidente->>'message',
            v_incidente->>'severity',
            (v_incidente->>'dismissible')::BOOLEAN
        )
        ON CONFLICT (clave_evento) WHERE estado = 'ACTIVA'
        DO UPDATE SET
            titulo = EXCLUDED.titulo,
            mensaje = EXCLUDED.mensaje,
            severidad = EXCLUDED.severidad,
            descartable = EXCLUDED.descartable,
            fecha_actualizacion = NOW();
    END LOOP;

    UPDATE tb_notificacion
    SET estado = 'RESUELTA',
        fecha_resolucion = NOW(),
        fecha_actualizacion = NOW()
    WHERE categoria = 'HARDWARE'
      AND estado = 'ACTIVA'
      AND NOT (clave_evento = ANY(v_claves_activas));
END;
$$;
