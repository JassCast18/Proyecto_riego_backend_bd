CREATE OR REPLACE PROCEDURE sp_cambiar_estado_proyecto(
    IN p_proyecto_id INTEGER,IN p_usuario_id INTEGER,IN p_sn_activo BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol ur
        WHERE ur.tb_proyecto_id=p_proyecto_id AND ur.tb_usuario_id=p_usuario_id
          AND ur.sn_activo=TRUE AND ur.tb_rol_id=1
    ) THEN RAISE EXCEPTION 'Solo un administrador del proyecto puede cambiar su estado.'; END IF;

    UPDATE tb_proyecto SET sn_activo=p_sn_activo,cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW()
    WHERE id=p_proyecto_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'El proyecto no existe.'; END IF;
END;
$$;
