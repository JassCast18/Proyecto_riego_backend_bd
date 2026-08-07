CREATE OR REPLACE FUNCTION fn_listar_cultivos()
RETURNS TABLE (id INTEGER, nombre VARCHAR)
LANGUAGE sql
AS $$
    SELECT c.id, c.nombre
    FROM tb_cultivo c
    WHERE c.sn_activo = TRUE
    ORDER BY c.nombre;
$$;
