CREATE OR REPLACE FUNCTION fn_listar_administradores_proyecto(p_proyecto_id INT)
RETURNS TABLE(correo VARCHAR,nombre VARCHAR)
LANGUAGE sql
AS $$
    SELECT DISTINCT u.correo_electronico,(p.nombres||' '||p.apellidos)::VARCHAR
    FROM tb_usuario_rol ur JOIN tb_usuario u ON u.id=ur.tb_usuario_id JOIN tb_persona p ON p.id=u.tb_persona_id
    WHERE ur.tb_proyecto_id=p_proyecto_id AND ur.tb_rol_id=1 AND ur.sn_activo=TRUE AND u.sn_activo=TRUE
      AND u.correo_electronico IS NOT NULL;
$$;
