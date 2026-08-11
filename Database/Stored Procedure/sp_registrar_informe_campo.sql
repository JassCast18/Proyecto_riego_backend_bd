CREATE OR REPLACE PROCEDURE sp_registrar_informe_campo(
    IN p_proyecto_id INT,IN p_usuario_id INT,IN p_titulo VARCHAR,IN p_asunto VARCHAR,
    IN p_observaciones TEXT,IN p_estado_general VARCHAR,IN p_color_hojas VARCHAR,
    IN p_cantidad_hojas INT,IN p_altura_cm DECIMAL,IN p_grosor_cm DECIMAL,
    IN p_presencia_plagas BOOLEAN,IN p_descripcion_plagas VARCHAR,
    IN p_acciones_realizadas TEXT,IN p_fecha_observacion DATE,
    INOUT p_informe_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE v_ciclo_id INT;
BEGIN
    IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE) THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto.';
    END IF;
    IF btrim(COALESCE(p_titulo,''))='' OR btrim(COALESCE(p_observaciones,''))='' THEN
        RAISE EXCEPTION 'El título y las observaciones son obligatorios.';
    END IF;
    IF EXISTS(
        SELECT 1 FROM tb_informe_supervision i
        WHERE i.tb_proyecto_id=p_proyecto_id
          AND lower(regexp_replace(btrim(i.titulo),'\s+',' ','g'))=
              lower(regexp_replace(btrim(p_titulo),'\s+',' ','g'))
    ) THEN
        RAISE EXCEPTION 'Ya existe un informe con este título dentro del proyecto. Utiliza un título diferente.';
    END IF;
    IF p_cantidad_hojas IS NOT NULL AND p_cantidad_hojas<0 THEN RAISE EXCEPTION 'La cantidad de hojas no puede ser negativa.'; END IF;
    IF p_altura_cm IS NOT NULL AND p_altura_cm<0 THEN RAISE EXCEPTION 'La altura no puede ser negativa.'; END IF;

    SELECT id INTO v_ciclo_id FROM tb_ciclo_cultivo WHERE tb_proyecto_id=p_proyecto_id AND estado='ACTIVO';
    INSERT INTO tb_informe_supervision(
        tb_usuario_id,tb_proyecto_id,tb_ciclo_cultivo_id,titulo,asunto,observaciones,
        estado_general,presencia_plagas,descripcion_plagas,acciones_realizadas,fecha_observacion
    ) VALUES(
        p_usuario_id,p_proyecto_id,v_ciclo_id,btrim(p_titulo),NULLIF(btrim(p_asunto),''),btrim(p_observaciones),
        NULLIF(btrim(p_estado_general),''),COALESCE(p_presencia_plagas,FALSE),NULLIF(btrim(p_descripcion_plagas),''),
        NULLIF(btrim(p_acciones_realizadas),''),COALESCE(p_fecha_observacion,CURRENT_DATE)
    ) RETURNING id INTO p_informe_id;

    INSERT INTO tb_datos_fenologicos(tb_informe_id,altura_planta_cm,grosor_planta_cm,cantidad_hojas,color_hojas_raw)
    VALUES(p_informe_id,p_altura_cm,p_grosor_cm,p_cantidad_hojas,NULLIF(btrim(p_color_hojas),''));
END;
$$;
