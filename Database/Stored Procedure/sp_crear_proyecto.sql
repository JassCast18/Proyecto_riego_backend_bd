DROP PROCEDURE IF EXISTS sp_crear_proyecto(VARCHAR, VARCHAR, INTEGER, INTEGER);

CREATE OR REPLACE PROCEDURE sp_crear_proyecto(
    IN p_nombre VARCHAR,
    IN p_descripcion VARCHAR,
    IN p_usuario_id INTEGER,
    INOUT p_proyecto_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rol_administrador INTEGER;
BEGIN
    IF NOT fn_es_propietario(p_usuario_id) THEN
        RAISE EXCEPTION 'Solo los usuarios marcados como propietarios pueden crear proyectos.';
    END IF;

    IF NULLIF(trim(p_nombre), '') IS NULL THEN
        RAISE EXCEPTION 'El nombre del proyecto es obligatorio.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM tb_proyecto
        WHERE cod_usuario_registro = p_usuario_id
          AND lower(nombre) = lower(trim(p_nombre))
    ) THEN
        RAISE EXCEPTION 'Ya tienes un proyecto con ese nombre.';
    END IF;

    SELECT id INTO v_rol_administrador
    FROM tb_rol
    WHERE lower(nombre_rol) = 'administrador'
    ORDER BY id
    LIMIT 1;

    IF v_rol_administrador IS NULL THEN
        RAISE EXCEPTION 'No existe el rol Administrador.';
    END IF;

    INSERT INTO tb_proyecto (nombre, descripcion, cod_usuario_registro)
    VALUES (trim(p_nombre), NULLIF(trim(p_descripcion), ''), p_usuario_id)
    RETURNING id INTO p_proyecto_id;

    INSERT INTO tb_usuario_rol (
        tb_usuario_id, tb_proyecto_id, tb_rol_id, cod_usuario_registro
    ) VALUES (
        p_usuario_id, p_proyecto_id, v_rol_administrador, p_usuario_id
    );
END;
$$;
