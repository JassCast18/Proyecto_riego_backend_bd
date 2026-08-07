CREATE OR REPLACE FUNCTION fn_validar_acceso_proyecto(p_usuario_id INTEGER,p_proyecto_id INTEGER)
RETURNS TABLE (rol_id INTEGER,rol VARCHAR,es_propietario BOOLEAN)
LANGUAGE sql
AS $$
    SELECT ur.tb_rol_id,r.nombre_rol,(u.sn_propietario=-1)
    FROM tb_usuario_rol ur
    INNER JOIN tb_usuario u ON u.id=ur.tb_usuario_id
    INNER JOIN tb_proyecto p ON p.id=ur.tb_proyecto_id AND p.sn_activo=TRUE
    INNER JOIN tb_rol r ON r.id=ur.tb_rol_id
    WHERE ur.tb_usuario_id=p_usuario_id AND ur.tb_proyecto_id=p_proyecto_id
      AND ur.sn_activo=TRUE;
$$;
