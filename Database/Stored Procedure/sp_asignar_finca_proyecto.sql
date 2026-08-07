CREATE OR REPLACE PROCEDURE sp_asignar_finca_proyecto(
    IN p_finca_id INTEGER,
    IN p_proyecto_id INTEGER,
    IN p_usuario_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id
          AND sn_activo=TRUE AND tb_rol_id=1
    ) THEN
        RAISE EXCEPTION 'No tienes permiso para migrar datos a este proyecto.';
    END IF;

    UPDATE tb_finca
    SET tb_proyecto_id=p_proyecto_id
    WHERE id=p_finca_id AND (tb_proyecto_id IS NULL OR tb_proyecto_id=p_proyecto_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La finca no existe o ya pertenece a otro proyecto.';
    END IF;

    UPDATE tb_notificacion no
    SET tb_proyecto_id=p_proyecto_id
    FROM tb_nodo_iot n
    INNER JOIN tb_sector s ON s.id=n.tb_sector_id
    WHERE no.tb_nodo_id=n.id
      AND s.tb_finca_id=p_finca_id
      AND no.tb_proyecto_id IS NULL;
END;
$$;
