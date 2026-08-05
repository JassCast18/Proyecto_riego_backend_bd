DROP FUNCTION IF EXISTS fn_listar_nodos_hardware();

CREATE OR REPLACE FUNCTION fn_listar_nodos_hardware()
RETURNS TABLE(
    id INTEGER,
    tb_sector_id INTEGER,
    tipo_nodo VARCHAR,
    direccion_mac VARCHAR,
    estado_energia VARCHAR
)
LANGUAGE sql
AS
$$
    SELECT
        n.id,
        n.tb_sector_id,
        n.tipo_nodo,
        n.direccion_mac,
        n.estado_energia
    FROM tb_nodo_iot n
    ORDER BY n.id;
$$;