DROP FUNCTION IF EXISTS fn_listar_informes_campo(INT,INT);
CREATE OR REPLACE FUNCTION fn_listar_informes_campo(p_proyecto_id INT,p_usuario_id INT)
RETURNS TABLE(
    id INT,titulo VARCHAR,asunto VARCHAR,observaciones TEXT,estado_general VARCHAR,
    presencia_plagas BOOLEAN,descripcion_plagas VARCHAR,acciones_realizadas TEXT,
    fecha_observacion DATE,fecha_registra TIMESTAMP,usuario VARCHAR,numero_ciclo INT,
    altura_cm DECIMAL,grosor_cm DECIMAL,cantidad_hojas INT,color_hojas VARCHAR,adjuntos JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE) THEN RAISE EXCEPTION 'No tienes acceso a este proyecto.'; END IF;
    RETURN QUERY SELECT i.id,i.titulo,i.asunto,i.observaciones,i.estado_general,i.presencia_plagas,
        i.descripcion_plagas,i.acciones_realizadas,i.fecha_observacion,i.fecha_registra,
        (p.nombres||' '||p.apellidos)::VARCHAR,c.numero_ciclo,d.altura_planta_cm,d.grosor_planta_cm,
        d.cantidad_hojas,d.color_hojas_raw,COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id',a.id,'nombre',a.nombre_original,'tipo',a.tipo_mime,'tamano',a.tamano_bytes
        ) ORDER BY a.id) FROM tb_informe_adjunto a WHERE a.tb_informe_id=i.id),'[]'::JSONB)
    FROM tb_informe_supervision i
    LEFT JOIN tb_usuario u ON u.id=i.tb_usuario_id LEFT JOIN tb_persona p ON p.id=u.tb_persona_id
    LEFT JOIN tb_ciclo_cultivo c ON c.id=i.tb_ciclo_cultivo_id
    LEFT JOIN tb_datos_fenologicos d ON d.tb_informe_id=i.id
    WHERE i.tb_proyecto_id=p_proyecto_id ORDER BY i.fecha_observacion DESC,i.id DESC;
END;
$$;
