DROP PROCEDURE IF EXISTS sp_actualizar_estado_energia_nodo(INT, VARCHAR);
DROP PROCEDURE IF EXISTS sp_actualizar_estado_energia_nodo(INT, VARCHAR, INT);

CREATE OR REPLACE PROCEDURE sp_actualizar_estado_energia_nodo(
    IN p_id_nodo INT,
    IN p_estado_energia VARCHAR,
    IN p_proyecto_id INT,
    IN p_usuario_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE v_estado_anterior VARCHAR;
BEGIN
    SELECT n.estado_energia INTO v_estado_anterior FROM tb_nodo_iot n
    JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id
    WHERE n.id=p_id_nodo AND f.tb_proyecto_id=p_proyecto_id;
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

    IF v_estado_anterior IS DISTINCT FROM UPPER(TRIM(p_estado_energia)) THEN
        INSERT INTO tb_bitacora_auditoria(
            tb_proyecto_id,accion_realizada,categoria,origen,entidad,entidad_id,detalle,
            valores_anteriores,valores_nuevos,tb_usuario_id,fecha_hora
        ) VALUES(
            p_proyecto_id,'Estado de energía del nodo actualizado','INFRAESTRUCTURA','USUARIO',
            'tb_nodo_iot',p_id_nodo,'El nodo #'||p_id_nodo||' cambió de '||COALESCE(v_estado_anterior,'SIN ESTADO')||' a '||UPPER(TRIM(p_estado_energia)),
            jsonb_build_object('estado_energia',v_estado_anterior),jsonb_build_object('estado_energia',UPPER(TRIM(p_estado_energia))),p_usuario_id,NOW()
        );
    END IF;
END;
$$;
