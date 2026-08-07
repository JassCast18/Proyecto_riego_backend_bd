DROP FUNCTION IF EXISTS fn_listar_catalogo_abm(VARCHAR);
DROP FUNCTION IF EXISTS fn_listar_catalogo_abm(VARCHAR, INTEGER);

CREATE OR REPLACE FUNCTION fn_listar_catalogo_abm(p_tabla VARCHAR, p_proyecto_id INTEGER)
RETURNS TABLE(registro JSONB)
LANGUAGE plpgsql
AS $$
DECLARE v_sql TEXT;
BEGIN
    IF p_tabla NOT IN ('tb_finca','tb_sector','tb_cliente','tb_rol','tb_nodo_iot','tb_sensor_actuador') THEN
        RAISE EXCEPTION 'La tabla solicitada no está habilitada para ABM dinámico.';
    END IF;

    v_sql := CASE p_tabla
        WHEN 'tb_finca' THEN
            'SELECT to_jsonb(t) FROM tb_finca t WHERE t.tb_proyecto_id = $1 ORDER BY t.id'
        WHEN 'tb_sector' THEN
            'SELECT to_jsonb(t) FROM tb_sector t INNER JOIN tb_finca f ON f.id=t.tb_finca_id WHERE f.tb_proyecto_id=$1 ORDER BY t.id'
        WHEN 'tb_nodo_iot' THEN
            'SELECT to_jsonb(t) FROM tb_nodo_iot t INNER JOIN tb_sector s ON s.id=t.tb_sector_id INNER JOIN tb_finca f ON f.id=s.tb_finca_id WHERE f.tb_proyecto_id=$1 ORDER BY t.id'
        WHEN 'tb_sensor_actuador' THEN
            'SELECT to_jsonb(t) FROM tb_sensor_actuador t INNER JOIN tb_nodo_iot n ON n.id=t.tb_nodo_id INNER JOIN tb_sector s ON s.id=n.tb_sector_id INNER JOIN tb_finca f ON f.id=s.tb_finca_id WHERE f.tb_proyecto_id=$1 ORDER BY t.id'
        WHEN 'tb_rol' THEN
            'SELECT to_jsonb(x) FROM (SELECT r.id,r.nombre_rol,
                (SELECT count(DISTINCT pm.tb_modulo_id) FROM tb_permiso_modulo pm WHERE pm.tb_rol_id=r.id AND pm.sn_activo=TRUE) AS modulos_asignados,
                (SELECT count(DISTINCT ps.tb_submodulo_id) FROM tb_permiso_submodulo ps WHERE ps.tb_rol_id=r.id AND ps.sn_activo=TRUE) AS submodulos_asignados
             FROM tb_rol r ORDER BY r.id) x'
        ELSE format('SELECT to_jsonb(t) FROM %I t ORDER BY t.id', p_tabla)
    END;

    IF p_tabla IN ('tb_cliente', 'tb_rol') THEN RETURN QUERY EXECUTE v_sql;
    ELSE RETURN QUERY EXECUTE v_sql USING p_proyecto_id;
    END IF;
END;
$$;
