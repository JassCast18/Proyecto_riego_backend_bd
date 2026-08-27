CREATE OR REPLACE PROCEDURE sp_actualizar_preferencia_alertas_correo(
    p_proyecto_id INT,
    p_usuario_id INT,
    p_habilitado BOOLEAN,
    p_usuario_modifica INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM tb_usuario_rol ur
        INNER JOIN tb_rol r ON r.id = ur.tb_rol_id
        INNER JOIN tb_usuario u ON u.id = ur.tb_usuario_id
        WHERE ur.tb_proyecto_id = p_proyecto_id
          AND ur.tb_usuario_id = p_usuario_id
          AND ur.sn_activo = TRUE
          AND u.sn_activo = TRUE
          AND lower(r.nombre_rol) = 'administrador'
    ) THEN
        RAISE EXCEPTION 'Solo un administrador activo del proyecto puede recibir correos de alertas.'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE tb_usuario_rol
       SET recibe_alertas_correo = p_habilitado,
           cod_usuario_modifica = p_usuario_modifica,
           fecha_modifica = NOW()
     WHERE tb_proyecto_id = p_proyecto_id
       AND tb_usuario_id = p_usuario_id
       AND sn_activo = TRUE;
END;
$$;
