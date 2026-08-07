CREATE OR REPLACE FUNCTION fn_listar_historial_parametrizacion(p_proyecto_id INTEGER,p_usuario_id INTEGER)
RETURNS TABLE (
    id INTEGER,tipo_evento VARCHAR,origen VARCHAR,valores_anteriores JSONB,
    valores_nuevos JSONB,motivo VARCHAR,nivel_confianza DECIMAL,
    usuario VARCHAR,fecha_registra TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE
    ) THEN RAISE EXCEPTION 'No tienes acceso a este proyecto.'; END IF;

    RETURN QUERY
    SELECT h.id,h.tipo_evento,h.origen,h.valores_anteriores,h.valores_nuevos,h.motivo,
           h.nivel_confianza,CASE WHEN u.id IS NULL THEN NULL ELSE (pe.nombres||' '||pe.apellidos)::VARCHAR END,
           h.fecha_registra
    FROM tb_historial_parametrizacion_cultivo h
    LEFT JOIN tb_usuario u ON u.id=h.cod_usuario_registro
    LEFT JOIN tb_persona pe ON pe.id=u.tb_persona_id
    WHERE h.tb_proyecto_id=p_proyecto_id
    ORDER BY h.fecha_registra DESC,h.id DESC;
END;
$$;
