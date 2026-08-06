DROP FUNCTION IF EXISTS fn_listar_usuarios(VARCHAR);

CREATE OR REPLACE FUNCTION fn_listar_usuarios(
    p_busqueda VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    tb_persona_id INTEGER,
    tb_rol_id INTEGER,
    nombres VARCHAR,
    apellidos VARCHAR,
    nombre_completo VARCHAR,
    correo_electronico VARCHAR,
    username VARCHAR,
    codigo_pais VARCHAR,
    telefono VARCHAR,
    rol VARCHAR,
    sn_activo BOOLEAN,
    cod_usuario_registro INTEGER,
    fecha_registra TIMESTAMP,
    cod_usuario_modifica INTEGER,
    fecha_modifica TIMESTAMP
)
LANGUAGE plpgsql
AS
$$
BEGIN
    RETURN QUERY
    SELECT
        usu.id,
        usu.tb_persona_id,
        usu.tb_rol_id,
        per.nombres,
        per.apellidos,
        (per.nombres || ' ' || per.apellidos)::VARCHAR AS nombre_completo,
        usu.correo_electronico,
        usu.username,
        usu.codigo_pais,
        usu.telefono,
        rol.nombre_rol AS rol,
        usu.sn_activo,
        usu.cod_usuario_registro,
        usu.fecha_registra,
        usu.cod_usuario_modifica,
        usu.fecha_modifica
    FROM tb_usuario usu
    INNER JOIN tb_persona per ON per.id = usu.tb_persona_id
    INNER JOIN tb_rol rol ON rol.id = usu.tb_rol_id
    WHERE (
        p_busqueda IS NULL
        OR btrim(p_busqueda) = ''
        OR lower(per.nombres || ' ' || per.apellidos) LIKE '%' || lower(p_busqueda) || '%'
        OR lower(usu.correo_electronico) LIKE '%' || lower(p_busqueda) || '%'
        OR lower(COALESCE(usu.username, '')) LIKE '%' || lower(p_busqueda) || '%'
        OR COALESCE(usu.codigo_pais || usu.telefono, '') LIKE '%' || replace(p_busqueda, ' ', '') || '%'
        OR lower(rol.nombre_rol) LIKE '%' || lower(p_busqueda) || '%'
    )
    ORDER BY usu.fecha_registra DESC, usu.id DESC;
END;
$$;
