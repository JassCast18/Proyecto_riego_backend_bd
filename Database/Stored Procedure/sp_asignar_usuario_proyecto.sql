CREATE OR REPLACE PROCEDURE sp_asignar_usuario_proyecto(
    IN p_proyecto_id INTEGER,
    IN p_usuario_id_asignar INTEGER,
    IN p_rol_id INTEGER,
    IN p_usuario_admin_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id = p_proyecto_id AND tb_usuario_id = p_usuario_admin_id
          AND sn_activo = TRUE AND tb_rol_id = 1
    ) THEN
        RAISE EXCEPTION 'No tienes permiso para asignar usuarios a este proyecto.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_usuario WHERE id = p_usuario_id_asignar AND sn_activo = TRUE) THEN
        RAISE EXCEPTION 'El usuario seleccionado no existe o está desactivado.';
    END IF;

    INSERT INTO tb_usuario_rol (
        tb_usuario_id, tb_proyecto_id, tb_rol_id,
        cod_usuario_registro
    ) VALUES (
        p_usuario_id_asignar, p_proyecto_id, p_rol_id,
        p_usuario_admin_id
    )
    ON CONFLICT (tb_usuario_id, tb_proyecto_id) DO UPDATE SET
        tb_rol_id = EXCLUDED.tb_rol_id,
        sn_activo = TRUE,
        cod_usuario_modifica = p_usuario_admin_id,
        fecha_modifica = NOW();
END;
$$;
