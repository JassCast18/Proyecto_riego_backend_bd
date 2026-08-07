CREATE OR REPLACE PROCEDURE sp_cambiar_estado_usuario_proyecto(
    IN p_proyecto_id INTEGER,
    IN p_usuario_id INTEGER,
    IN p_sn_activo BOOLEAN,
    IN p_rol_id INTEGER,
    IN p_usuario_admin_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_admin_id
          AND sn_activo=TRUE AND tb_rol_id=1
    ) THEN
        RAISE EXCEPTION 'No tienes permiso para administrar usuarios en este proyecto.';
    END IF;

    IF p_sn_activo THEN
        IF NOT EXISTS (SELECT 1 FROM tb_usuario WHERE id=p_usuario_id AND sn_activo=TRUE) THEN
            RAISE EXCEPTION 'El usuario no existe o está desactivado.';
        END IF;
        INSERT INTO tb_usuario_rol (
            tb_usuario_id,tb_proyecto_id,tb_rol_id,sn_activo,cod_usuario_registro
        ) VALUES (
            p_usuario_id,p_proyecto_id,COALESCE(p_rol_id,2),TRUE,p_usuario_admin_id
        )
        ON CONFLICT (tb_usuario_id,tb_proyecto_id) DO UPDATE SET
            tb_rol_id=COALESCE(p_rol_id,tb_usuario_rol.tb_rol_id),
            sn_activo=TRUE,cod_usuario_modifica=p_usuario_admin_id,fecha_modifica=NOW();
    ELSE
        UPDATE tb_usuario_rol
        SET sn_activo=FALSE,cod_usuario_modifica=p_usuario_admin_id,fecha_modifica=NOW()
        WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id
          ;
        IF NOT FOUND THEN RAISE EXCEPTION 'El usuario no pertenece al proyecto.'; END IF;
    END IF;
END;
$$;
