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
    PERFORM pg_advisory_xact_lock(4100,p_id_nodo);
    CALL sp_sincronizar_ciclos_riego(p_proyecto_id,p_id_nodo);
    IF UPPER(TRIM(p_estado_energia))='APAGADO' AND EXISTS(SELECT 1 FROM tb_ciclo_riego WHERE tb_nodo_id=p_id_nodo AND estado='ACTIVO') THEN
        RAISE EXCEPTION 'No puedes apagar el nodo mientras existe un riego activo; espera el cierre de seguridad.';
    END IF;
    IF UPPER(TRIM(p_estado_energia)) NOT IN ('ENCENDIDO','APAGADO') THEN
        RAISE EXCEPTION 'El estado de energia solicitado no es valido.';
    END IF;

    IF UPPER(TRIM(p_estado_energia))='ENCENDIDO' AND (
        NOT EXISTS(
            SELECT 1 FROM tb_sensor s WHERE s.tb_nodo_id=p_id_nodo AND s.sn_activo=TRUE
              AND s.estado_operativo='OPERATIVO'
        ) OR EXISTS(
            SELECT 1 FROM tb_sensor s WHERE s.tb_nodo_id=p_id_nodo AND s.sn_activo=TRUE
              AND s.estado_operativo='OPERATIVO'
              AND (s.tipo_componente ILIKE '%higr%' OR s.tipo_componente ILIKE '%hum%')
              AND (s.adc_seco IS NULL OR s.adc_humedo IS NULL)
        )
    ) THEN
        RAISE EXCEPTION 'El nodo necesita al menos un sensor operativo y los sensores de humedad operativos deben estar calibrados.';
    END IF;

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
