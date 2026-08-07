CREATE OR REPLACE PROCEDURE sp_crear_infraestructura_proyecto(
    IN p_proyecto_id INTEGER,
    IN p_usuario_id INTEGER,
    IN p_ubicacion_finca VARCHAR,
    IN p_nombre_sector VARCHAR,
    IN p_tipo_nodo VARCHAR,
    IN p_direccion_mac VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_finca_id INTEGER;
    v_sector_id INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id = p_proyecto_id AND tb_usuario_id = p_usuario_id
          AND sn_activo = TRUE AND tb_rol_id = 1
    ) THEN
        RAISE EXCEPTION 'No tienes permiso para configurar este proyecto.';
    END IF;

    IF NULLIF(trim(p_ubicacion_finca), '') IS NULL THEN
        RAISE EXCEPTION 'La ubicación o nombre de la finca es obligatorio.';
    END IF;

    INSERT INTO tb_finca (tb_proyecto_id, ubicacion_geografica)
    VALUES (p_proyecto_id, trim(p_ubicacion_finca))
    RETURNING id INTO v_finca_id;

    IF NULLIF(trim(p_nombre_sector), '') IS NOT NULL THEN
        INSERT INTO tb_sector (tb_finca_id, nombre_sector)
        VALUES (v_finca_id, trim(p_nombre_sector))
        RETURNING id INTO v_sector_id;
    END IF;

    IF v_sector_id IS NOT NULL AND NULLIF(trim(p_direccion_mac), '') IS NOT NULL THEN
        INSERT INTO tb_nodo_iot (tb_sector_id, tipo_nodo, direccion_mac, estado_energia)
        VALUES (v_sector_id, COALESCE(NULLIF(trim(p_tipo_nodo), ''), 'Riego'), upper(trim(p_direccion_mac)), 'APAGADO');
    END IF;
END;
$$;
