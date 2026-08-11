CREATE OR REPLACE FUNCTION fn_obtener_adjunto_informe(p_adjunto_id BIGINT,p_proyecto_id INT,p_usuario_id INT)
RETURNS TABLE(ruta_archivo VARCHAR,nombre_original VARCHAR,tipo_mime VARCHAR)
LANGUAGE sql
AS $$
    SELECT a.ruta_archivo,a.nombre_original,a.tipo_mime FROM tb_informe_adjunto a
    JOIN tb_informe_supervision i ON i.id=a.tb_informe_id
    WHERE a.id=p_adjunto_id AND i.tb_proyecto_id=p_proyecto_id
      AND EXISTS(SELECT 1 FROM tb_usuario_rol ur WHERE ur.tb_proyecto_id=p_proyecto_id AND ur.tb_usuario_id=p_usuario_id AND ur.sn_activo=TRUE);
$$;
