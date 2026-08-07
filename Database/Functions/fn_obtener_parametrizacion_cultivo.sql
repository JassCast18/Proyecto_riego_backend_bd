CREATE OR REPLACE FUNCTION fn_obtener_parametrizacion_cultivo(p_proyecto_id INTEGER,p_usuario_id INTEGER)
RETURNS TABLE (
    proyecto_id INTEGER,proyecto VARCHAR,descripcion VARCHAR,proyecto_activo BOOLEAN,
    cultivo VARCHAR,variedad VARCHAR,fecha_siembra DATE,tiempo_cosecha_dias INTEGER,
    humedad_minima DECIMAL,humedad_maxima DECIMAL,temperatura_minima DECIMAL,
    temperatura_maxima DECIMAL,observaciones VARCHAR,fecha_carga TIMESTAMP,fecha_actualizacion TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE
    ) THEN RAISE EXCEPTION 'No tienes acceso a este proyecto.'; END IF;

    RETURN QUERY
    SELECT p.id,p.nombre,p.descripcion,p.sn_activo,c.nombre,pc.variedad,pc.fecha_siembra,
           pc.tiempo_cosecha_dias,pc.humedad_suelo_minima,pc.humedad_suelo_maxima,
           pc.temperatura_minima,pc.temperatura_maxima,pc.observaciones,
           pc.fecha_registra,pc.fecha_modifica
    FROM tb_proyecto p
    LEFT JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=p.id
    LEFT JOIN tb_cultivo c ON c.id=pc.tb_cultivo_id
    WHERE p.id=p_proyecto_id;
END;
$$;
