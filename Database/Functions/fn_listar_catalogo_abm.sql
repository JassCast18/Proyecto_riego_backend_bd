DROP FUNCTION IF EXISTS fn_listar_catalogo_abm(VARCHAR);

CREATE OR REPLACE FUNCTION fn_listar_catalogo_abm(
    p_tabla VARCHAR
)
RETURNS TABLE(
    registro JSONB
)
LANGUAGE plpgsql
AS
$$
BEGIN
    IF p_tabla NOT IN (
        'tb_finca',
        'tb_sector',
        'tb_cliente',
        'tb_rol',
        'tb_nodo_iot',
        'tb_sensor_actuador'
    ) THEN
        RAISE EXCEPTION 'La tabla solicitada no está habilitada para ABM dinámico.';
    END IF;

    RETURN QUERY EXECUTE format(
        'SELECT to_jsonb(t) AS registro FROM %I AS t ORDER BY t.id',
        p_tabla
    );
END;
$$;