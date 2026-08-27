CREATE OR REPLACE FUNCTION fn_listar_revisores_notificaciones(p_proyecto_id INT)
RETURNS TABLE(id INT,nombre VARCHAR)
LANGUAGE sql
AS $$
    SELECT DISTINCT u.id,concat_ws(' ',p.nombres,p.apellidos)::VARCHAR
    FROM tb_notificacion_usuario nu
    INNER JOIN tb_notificacion n ON n.id=nu.tb_notificacion_id
    INNER JOIN tb_usuario u ON u.id=nu.tb_usuario_id
    INNER JOIN tb_persona p ON p.id=u.tb_persona_id
    WHERE n.tb_proyecto_id=p_proyecto_id AND nu.revisada=TRUE
    ORDER BY 2;
$$;
