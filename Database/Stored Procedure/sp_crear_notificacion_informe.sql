CREATE OR REPLACE PROCEDURE sp_crear_notificacion_informe(
    p_proyecto_id INT,p_informe_id INT,p_usuario_id INT,p_titulo VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE v_rol_administrador INT; v_autor VARCHAR;
BEGIN
    SELECT id INTO v_rol_administrador FROM tb_rol WHERE lower(nombre_rol)='administrador' LIMIT 1;
    IF v_rol_administrador IS NULL THEN RAISE EXCEPTION 'No existe el rol Administrador.'; END IF;

    SELECT concat_ws(' ',p.nombres,p.apellidos) INTO v_autor
    FROM tb_usuario u JOIN tb_persona p ON p.id=u.tb_persona_id WHERE u.id=p_usuario_id;

    INSERT INTO tb_notificacion(
        clave_evento,tb_proyecto_id,tb_rol_id,categoria,tipo,titulo,mensaje,
        severidad,estado,descartable,persistencia_segundos,
        fecha_primera_deteccion,fecha_ultima_deteccion,ocurrencias
    ) VALUES(
        'INFORME:'||p_informe_id,p_proyecto_id,v_rol_administrador,'INFORMES',
        'INFORME_REGISTRADO','Nuevo informe de campo',
        COALESCE(v_autor,'Un usuario')||' registró el informe "'||p_titulo||'".',
        'INFO','ACTIVA',TRUE,0,NOW(),NOW(),1
    ) ON CONFLICT(clave_evento) WHERE estado IN ('PENDIENTE','ACTIVA','RECONOCIDA') DO NOTHING;
END;
$$;
