CREATE OR REPLACE FUNCTION fn_obtener_nombre_usuario(p_usuario_id INT)
RETURNS VARCHAR
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(btrim(concat_ws(' ',p.nombres,p.apellidos)),'')::VARCHAR
    FROM tb_usuario u
    INNER JOIN tb_persona p ON p.id=u.tb_persona_id
    WHERE u.id=p_usuario_id;
$$;
