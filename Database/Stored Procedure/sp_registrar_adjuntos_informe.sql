CREATE OR REPLACE PROCEDURE sp_registrar_adjuntos_informe(
    IN p_informe_id INT,IN p_proyecto_id INT,IN p_adjuntos JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM tb_informe_supervision WHERE id=p_informe_id AND tb_proyecto_id=p_proyecto_id) THEN
        RAISE EXCEPTION 'El informe no pertenece al proyecto.';
    END IF;
    INSERT INTO tb_informe_adjunto(tb_informe_id,nombre_original,nombre_archivo,ruta_archivo,tipo_mime,tamano_bytes)
    SELECT p_informe_id,x.nombre_original,x.nombre_archivo,x.ruta_archivo,x.tipo_mime,x.tamano_bytes
    FROM jsonb_to_recordset(COALESCE(p_adjuntos,'[]'::JSONB)) AS x(
        nombre_original VARCHAR,nombre_archivo VARCHAR,ruta_archivo VARCHAR,tipo_mime VARCHAR,tamano_bytes BIGINT
    );
END;
$$;
