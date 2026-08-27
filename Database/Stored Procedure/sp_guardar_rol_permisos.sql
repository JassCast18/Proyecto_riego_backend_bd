CREATE OR REPLACE PROCEDURE sp_guardar_rol_permisos(
    IN p_rol_id INTEGER,
    IN p_nombre_rol VARCHAR,
    IN p_modulos INTEGER[],
    IN p_submodulos INTEGER[],
    INOUT p_rol_guardado_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre VARCHAR := btrim(p_nombre_rol);
    v_modulos INTEGER[] := COALESCE(p_modulos,'{}');
    v_sequence_name TEXT;
    v_max_id BIGINT;
BEGIN
    IF v_nombre IS NULL OR v_nombre='' THEN RAISE EXCEPTION 'El nombre del rol es obligatorio.'; END IF;
    IF EXISTS (SELECT 1 FROM tb_rol WHERE lower(nombre_rol)=lower(v_nombre) AND id<>COALESCE(p_rol_id,0)) THEN
        RAISE EXCEPTION 'Ya existe un rol con ese nombre.';
    END IF;
    IF EXISTS (
        SELECT 1 FROM unnest(COALESCE(p_modulos, '{}')) requested(id)
        LEFT JOIN tb_modulo m ON m.id=requested.id AND m.sn_activo=TRUE
        WHERE m.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Uno o más módulos seleccionados no existen o están inactivos.';
    END IF;
    IF EXISTS (
        SELECT 1 FROM unnest(COALESCE(p_submodulos, '{}')) requested(id)
        LEFT JOIN tb_submodulo s ON s.id=requested.id AND s.sn_activo=TRUE
        WHERE s.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Uno o más submódulos seleccionados no existen o están inactivos.';
    END IF;

    IF p_rol_id IS NULL THEN
        SELECT pg_get_serial_sequence('tb_rol','id'),COALESCE(MAX(id),0)
        INTO v_sequence_name,v_max_id FROM tb_rol;
        PERFORM setval(v_sequence_name,GREATEST(v_max_id,1),v_max_id>0);
        INSERT INTO tb_rol(nombre_rol) VALUES(v_nombre) RETURNING id INTO p_rol_guardado_id;
    ELSE
        UPDATE tb_rol SET nombre_rol=v_nombre WHERE id=p_rol_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'El rol indicado no existe.'; END IF;
        p_rol_guardado_id:=p_rol_id;
    END IF;

    -- Un submódulo siempre requiere acceso a su módulo padre.
    SELECT ARRAY(SELECT DISTINCT value FROM unnest(v_modulos || COALESCE((
        SELECT array_agg(DISTINCT tb_modulo_id) FROM tb_submodulo WHERE id=ANY(COALESCE(p_submodulos,'{}'))
    ),'{}')) value) INTO v_modulos;

    UPDATE tb_permiso_modulo SET sn_activo=FALSE WHERE tb_rol_id=p_rol_guardado_id;
    UPDATE tb_permiso_submodulo SET sn_activo=FALSE WHERE tb_rol_id=p_rol_guardado_id;

    SELECT pg_get_serial_sequence('tb_permiso_modulo','id'),COALESCE(MAX(id),0)
    INTO v_sequence_name,v_max_id FROM tb_permiso_modulo;
    PERFORM setval(v_sequence_name,GREATEST(v_max_id,1),v_max_id>0);

    INSERT INTO tb_permiso_modulo(tb_rol_id,tb_modulo_id,tb_permiso_id,sn_activo)
    SELECT p_rol_guardado_id,m.id,p.id,TRUE
    FROM tb_modulo m JOIN tb_permiso p ON p.codigo_permiso=m.codigo_modulo||'.view'
    WHERE m.id=ANY(v_modulos) AND m.sn_activo=TRUE AND p.sn_activo=TRUE
    ON CONFLICT (tb_rol_id,tb_modulo_id,tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

    SELECT pg_get_serial_sequence('tb_permiso_submodulo','id'),COALESCE(MAX(id),0)
    INTO v_sequence_name,v_max_id FROM tb_permiso_submodulo;
    PERFORM setval(v_sequence_name,GREATEST(v_max_id,1),v_max_id>0);

    INSERT INTO tb_permiso_submodulo(tb_rol_id,tb_submodulo_id,tb_permiso_id,sn_activo)
    SELECT p_rol_guardado_id,s.id,p.id,TRUE
    FROM tb_submodulo s JOIN tb_permiso p ON p.codigo_permiso=s.codigo_submodulo||'.view'
    WHERE s.id=ANY(COALESCE(p_submodulos,'{}')) AND s.sn_activo=TRUE AND p.sn_activo=TRUE
    ON CONFLICT (tb_rol_id,tb_submodulo_id,tb_permiso_id) DO UPDATE SET sn_activo=TRUE;
END;
$$;
