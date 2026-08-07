DROP PROCEDURE IF EXISTS sp_actualizar_estado_energia_nodo(INT, VARCHAR);

CREATE OR REPLACE PROCEDURE sp_actualizar_estado_energia_nodo(
    IN p_id_nodo INT,
    IN p_estado_energia VARCHAR,
    IN p_proyecto_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE tb_nodo_iot n
    SET estado_energia = UPPER(TRIM(p_estado_energia))
    FROM tb_sector s, tb_finca f
    WHERE n.id = p_id_nodo
      AND s.id = n.tb_sector_id
      AND f.id = s.tb_finca_id
      AND f.tb_proyecto_id = p_proyecto_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El nodo no existe dentro del proyecto seleccionado.';
    END IF;
END;
$$;
