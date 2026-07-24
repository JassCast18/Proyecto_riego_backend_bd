DROP FUNCTION IF EXISTS fn_listar_roles();

CREATE OR REPLACE FUNCTION fn_listar_roles()
RETURNS TABLE(
    id INTEGER,
    nombre_rol VARCHAR
)
LANGUAGE sql
AS
$$
    SELECT id, nombre_rol
    FROM tb_rol
    ORDER BY nombre_rol;
$$;