DROP FUNCTION IF EXISTS fn_listar_permisos_rol(INTEGER);

CREATE OR REPLACE FUNCTION fn_listar_permisos_rol(
    p_tb_rol_id INTEGER
)
RETURNS TABLE(
    codigo_permiso VARCHAR
)
LANGUAGE sql
AS
$$
    SELECT DISTINCT permiso.codigo_permiso
    FROM tb_permiso_modulo permiso_modulo
        INNER JOIN tb_permiso permiso
            ON permiso.id = permiso_modulo.tb_permiso_id
    WHERE permiso_modulo.tb_rol_id = p_tb_rol_id
      AND permiso_modulo.sn_activo = TRUE
      AND permiso.sn_activo = TRUE

    UNION

    SELECT DISTINCT permiso.codigo_permiso
    FROM tb_permiso_submodulo permiso_submodulo
        INNER JOIN tb_permiso permiso
            ON permiso.id = permiso_submodulo.tb_permiso_id
    WHERE permiso_submodulo.tb_rol_id = p_tb_rol_id
      AND permiso_submodulo.sn_activo = TRUE
      AND permiso.sn_activo = TRUE

    ORDER BY 1;
$$;