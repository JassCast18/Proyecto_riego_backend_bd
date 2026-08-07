CREATE OR REPLACE FUNCTION fn_obtener_accesos_rol(p_rol_id INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
AS $$
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id',m.id,'codigo',m.codigo_modulo,'nombre',m.nombre_modulo,
            'descripcion',m.descripcion,
            'seleccionado',EXISTS (
                SELECT 1 FROM tb_permiso_modulo pm
                WHERE pm.tb_rol_id=p_rol_id AND pm.tb_modulo_id=m.id AND pm.sn_activo=TRUE
            ),
            'submodulos',COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'id',s.id,'codigo',s.codigo_submodulo,'nombre',s.nombre_submodulo,
                    'descripcion',s.descripcion,
                    'seleccionado',EXISTS (
                        SELECT 1 FROM tb_permiso_submodulo ps
                        WHERE ps.tb_rol_id=p_rol_id AND ps.tb_submodulo_id=s.id AND ps.sn_activo=TRUE
                    )
                ) ORDER BY s.orden,s.id)
                FROM tb_submodulo s WHERE s.tb_modulo_id=m.id AND s.sn_activo=TRUE
            ),'[]'::JSONB)
        ) ORDER BY m.orden,m.id
    ),'[]'::JSONB)
    FROM tb_modulo m
    WHERE m.sn_activo=TRUE;
$$;
