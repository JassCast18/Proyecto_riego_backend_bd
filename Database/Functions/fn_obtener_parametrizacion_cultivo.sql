DROP FUNCTION IF EXISTS fn_obtener_parametrizacion_cultivo(INTEGER,INTEGER);
CREATE OR REPLACE FUNCTION fn_obtener_parametrizacion_cultivo(p_proyecto_id INTEGER,p_usuario_id INTEGER)
RETURNS TABLE (
    proyecto_id INTEGER,proyecto VARCHAR,descripcion VARCHAR,proyecto_activo BOOLEAN,
    cultivo VARCHAR,variedad VARCHAR,fecha_siembra DATE,tiempo_cosecha_dias INTEGER,
    humedad_minima DECIMAL,humedad_maxima DECIMAL,temperatura_minima DECIMAL,
    temperatura_maxima DECIMAL,observaciones VARCHAR,fecha_carga TIMESTAMP,fecha_actualizacion TIMESTAMP,
    cultivo_id INTEGER,ciclo_id INTEGER,numero_ciclo INTEGER,estado_ciclo VARCHAR,fecha_fin_ciclo DATE,
    fecha_primer_brote DATE,porcentaje_brote DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE
    ) THEN RAISE EXCEPTION 'No tienes acceso a este proyecto.'; END IF;

    RETURN QUERY
    SELECT p.id,p.nombre,p.descripcion,p.sn_activo,COALESCE(ca.nombre,c.nombre),COALESCE(cc.variedad,pc.variedad),COALESCE(cc.fecha_inicio,pc.fecha_siembra),
           pc.tiempo_cosecha_dias,pc.humedad_suelo_minima,pc.humedad_suelo_maxima,
           pc.temperatura_minima,pc.temperatura_maxima,pc.observaciones,
           pc.fecha_registra,pc.fecha_modifica,pc.tb_cultivo_id,cc.id,cc.numero_ciclo,cc.estado,cc.fecha_fin,
           cc.fecha_primer_brote,cc.porcentaje_brote
    FROM tb_proyecto p
    LEFT JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=p.id
    LEFT JOIN tb_cultivo c ON c.id=pc.tb_cultivo_id
    LEFT JOIN tb_ciclo_cultivo cc ON cc.tb_proyecto_id=p.id AND cc.estado='ACTIVO'
    LEFT JOIN tb_cultivo ca ON ca.id=cc.tb_cultivo_id
    WHERE p.id=p_proyecto_id;
END;
$$;
