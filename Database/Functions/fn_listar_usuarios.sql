DROP FUNCTION IF EXISTS fn_listar_usuarios(VARCHAR);
DROP FUNCTION IF EXISTS fn_listar_usuarios(VARCHAR,INTEGER,VARCHAR);

CREATE OR REPLACE FUNCTION fn_listar_usuarios(p_busqueda VARCHAR,p_proyecto_id INTEGER,p_alcance VARCHAR)
RETURNS TABLE(
    id INTEGER,tb_persona_id INTEGER,tb_rol_id INTEGER,nombres VARCHAR,
    apellidos VARCHAR,nombre_completo VARCHAR,correo_electronico VARCHAR,
    username VARCHAR,codigo_pais VARCHAR,telefono VARCHAR,rol VARCHAR,
    sn_activo BOOLEAN,cod_usuario_registro INTEGER,fecha_registra TIMESTAMP,
    cod_usuario_modifica INTEGER,fecha_modifica TIMESTAMP,
    asignado_proyecto BOOLEAN,tb_rol_proyecto_id INTEGER,rol_proyecto VARCHAR,
    sn_propietario SMALLINT,recibe_alertas_correo BOOLEAN
)
LANGUAGE sql
AS $$
    SELECT u.id,u.tb_persona_id,ur.tb_rol_id,p.nombres,p.apellidos,
           (p.nombres||' '||p.apellidos)::VARCHAR,u.correo_electronico,u.username,
           u.codigo_pais,u.telefono,r.nombre_rol,u.sn_activo,u.cod_usuario_registro,
           u.fecha_registra,u.cod_usuario_modifica,u.fecha_modifica,
           (ur.id IS NOT NULL AND ur.sn_activo),
           CASE WHEN ur.sn_activo THEN ur.tb_rol_id END,
           CASE WHEN ur.sn_activo THEN r.nombre_rol END,u.sn_propietario,
           CASE WHEN ur.sn_activo THEN ur.recibe_alertas_correo ELSE FALSE END
    FROM tb_usuario u
    INNER JOIN tb_persona p ON p.id=u.tb_persona_id
    LEFT JOIN tb_usuario_rol ur ON ur.tb_usuario_id=u.id AND ur.tb_proyecto_id=p_proyecto_id
    LEFT JOIN tb_rol r ON r.id=ur.tb_rol_id
    WHERE (lower(COALESCE(p_alcance,'proyecto'))='global' OR (ur.id IS NOT NULL AND ur.sn_activo=TRUE))
      AND (p_busqueda IS NULL OR btrim(p_busqueda)='' OR
           lower(p.nombres||' '||p.apellidos) LIKE '%'||lower(p_busqueda)||'%' OR
           lower(u.correo_electronico) LIKE '%'||lower(p_busqueda)||'%' OR
           lower(COALESCE(u.username,'')) LIKE '%'||lower(p_busqueda)||'%' OR
           COALESCE(u.codigo_pais||u.telefono,'') LIKE '%'||replace(p_busqueda,' ','')||'%' OR
           lower(COALESCE(r.nombre_rol,'')) LIKE '%'||lower(p_busqueda)||'%')
    ORDER BY u.fecha_registra DESC,u.id DESC;
$$;
