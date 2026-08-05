CREATE OR REPLACE PROCEDURE sp_actualizar_estado_energia_nodo(
    IN p_id_nodo INT,
    IN p_estado_energia VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE tb_nodo_iot
    SET estado_energia = UPPER(TRIM(p_estado_energia))
    WHERE id = p_id_nodo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El nodo % no existe.', p_id_nodo;
    END IF;
END;
$$;