DROP FUNCTION IF EXISTS fn_listar_proyectos_usuario(INTEGER);
DROP FUNCTION IF EXISTS fn_listar_proyectos_usuario(INTEGER,BOOLEAN);

CREATE OR REPLACE FUNCTION fn_listar_proyectos_usuario(p_usuario_id INTEGER,p_inactivos BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
    id INTEGER,nombre VARCHAR,descripcion VARCHAR,rol_id INTEGER,rol VARCHAR,
    es_propietario BOOLEAN,cultivo VARCHAR,configurado BOOLEAN,sn_activo BOOLEAN
)
LANGUAGE sql
AS $$
    SELECT p.id,p.nombre,p.descripcion,ur.tb_rol_id,r.nombre_rol,
           (u.sn_propietario=-1),c.nombre,(pc.id IS NOT NULL),p.sn_activo
    FROM tb_usuario_rol ur
    INNER JOIN tb_usuario u ON u.id=ur.tb_usuario_id
    INNER JOIN tb_proyecto p ON p.id=ur.tb_proyecto_id
    INNER JOIN tb_rol r ON r.id=ur.tb_rol_id
    LEFT JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=p.id
    LEFT JOIN tb_cultivo c ON c.id=pc.tb_cultivo_id
    WHERE ur.tb_usuario_id=p_usuario_id AND ur.sn_activo=TRUE
      AND p.sn_activo=(NOT COALESCE(p_inactivos,FALSE))
    ORDER BY p.fecha_registra DESC;
$$;
