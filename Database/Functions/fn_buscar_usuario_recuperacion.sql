CREATE OR REPLACE FUNCTION fn_buscar_usuario_recuperacion(
    p_correo_electronico VARCHAR
)
RETURNS TABLE (
    id INT,
    correo_electronico VARCHAR,
    nombre_completo VARCHAR
)
LANGUAGE sql
AS $$
    SELECT
        u.id,
        u.correo_electronico,
        concat_ws(' ', p.nombres, p.apellidos)::VARCHAR
    FROM tb_usuario u
    INNER JOIN tb_persona p ON p.id = u.tb_persona_id
    WHERE lower(u.correo_electronico) = lower(trim(p_correo_electronico))
      AND u.sn_activo = TRUE
    LIMIT 1;
$$;
