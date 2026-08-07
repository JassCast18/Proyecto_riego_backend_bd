DROP FUNCTION IF EXISTS fn_listar_nodos_hardware();
DROP FUNCTION IF EXISTS fn_listar_nodos_hardware(INTEGER);

CREATE OR REPLACE FUNCTION fn_listar_nodos_hardware(p_proyecto_id INTEGER DEFAULT NULL)
RETURNS TABLE(
    id INTEGER,
    tb_sector_id INTEGER,
    tipo_nodo VARCHAR,
    direccion_mac VARCHAR,
    estado_energia VARCHAR
)
LANGUAGE sql
AS $$
    SELECT n.id, n.tb_sector_id, n.tipo_nodo, n.direccion_mac, n.estado_energia
    FROM tb_nodo_iot n
    INNER JOIN tb_sector s ON s.id = n.tb_sector_id
    INNER JOIN tb_finca f ON f.id = s.tb_finca_id
    WHERE p_proyecto_id IS NULL OR f.tb_proyecto_id = p_proyecto_id
    ORDER BY n.id;
$$;
