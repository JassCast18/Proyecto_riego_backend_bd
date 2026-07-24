DROP FUNCTION IF EXISTS fn_login_usuario(VARCHAR);

CREATE OR REPLACE FUNCTION fn_login_usuario(
    p_username_correo VARCHAR
)
RETURNS TABLE(
    id INTEGER,
    tb_persona_id INTEGER,
    tb_rol_id INTEGER,
    correo_electronico VARCHAR,
    username VARCHAR,
    password_hash VARCHAR,
    nombre_completo VARCHAR,
    rol VARCHAR
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_correo VARCHAR;
BEGIN
    IF p_username_correo IS NOT NULL 
       AND p_username_correo <> '' THEN

        SELECT usu.correo_electronico
        INTO v_correo
        FROM tb_usuario usu
        WHERE usu.username = p_username_correo
        LIMIT 1;

        -- Si encontró usuario, reemplaza por el correo real
        IF v_correo IS NOT NULL THEN
            p_username_correo := v_correo;
        END IF;

    END IF;
    RETURN QUERY
    SELECT
        usu.id,
        usu.tb_persona_id,
        usu.tb_rol_id,
        usu.correo_electronico,
        usu.username,
        usu.password_hash,
        (per.nombres || ' ' || per.apellidos)::VARCHAR AS nombre_completo,
        rol.nombre_rol AS rol
    FROM tb_usuario AS usu
        INNER JOIN tb_persona AS per
            ON per.id = usu.tb_persona_id
        INNER JOIN tb_rol AS rol
            ON rol.id = usu.tb_rol_id
    WHERE usu.correo_electronico = p_username_correo
      AND usu.sn_activo = TRUE;

END;
$$;