CREATE OR REPLACE FUNCTION fn_listar_proyectos_monitoreo()
RETURNS TABLE(proyecto_id INT)
LANGUAGE sql
AS $$
    SELECT DISTINCT f.tb_proyecto_id
    FROM tb_finca f
    JOIN tb_sector s ON s.tb_finca_id=f.id
    JOIN tb_nodo_iot n ON n.tb_sector_id=s.id
    JOIN tb_proyecto p ON p.id=f.tb_proyecto_id
    WHERE f.tb_proyecto_id IS NOT NULL AND p.sn_activo=TRUE;
$$;
