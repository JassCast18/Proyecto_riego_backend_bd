DROP FUNCTION IF EXISTS fn_login_usuario(VARCHAR);

CREATE OR REPLACE FUNCTION fn_login_usuario(p_username_correo VARCHAR)
RETURNS TABLE(
    id INTEGER,tb_persona_id INTEGER,correo_electronico VARCHAR,username VARCHAR,
    codigo_pais VARCHAR,telefono VARCHAR,password_hash VARCHAR,nombre_completo VARCHAR,
    sn_propietario SMALLINT
)
LANGUAGE sql
AS $$
    SELECT u.id,u.tb_persona_id,u.correo_electronico,u.username,u.codigo_pais,
           u.telefono,u.password_hash,(p.nombres||' '||p.apellidos)::VARCHAR,
           u.sn_propietario
    FROM tb_usuario u
    INNER JOIN tb_persona p ON p.id=u.tb_persona_id
    WHERE (lower(u.correo_electronico)=lower(trim(p_username_correo))
       OR lower(u.username)=lower(trim(p_username_correo)))
      AND u.sn_activo=TRUE
    LIMIT 1;
$$;
