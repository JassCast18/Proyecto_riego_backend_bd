CREATE OR REPLACE FUNCTION fn_login_usuario(
    p_correo_electronico VARCHAR
)
RETURNS TABLE(
    id INTEGER,
    tb_persona_id INTEGER,
    tb_rol_id INTEGER,
    correo_electronico VARCHAR,
    password_hash VARCHAR,
    nombre_completo VARCHAR,
    rol VARCHAR
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
        usu.correo_electronico,
        usu.password_hash,
        (per.nombres || ' ' || per.apellidos)::VARCHAR AS nombre_completo,
        rol.nombre_rol AS rol
    FROM tb_usuario AS usu
        INNER JOIN tb_persona AS per
            ON per.id = usu.tb_persona_id
        INNER JOIN tb_rol AS rol
            ON rol.id = usu.tb_rol_id
    WHERE usu.correo_electronico = p_correo_electronico
      AND usu.sn_activo = TRUE;

END;
$$;