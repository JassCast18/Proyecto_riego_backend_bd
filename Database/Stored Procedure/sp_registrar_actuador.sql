CREATE OR REPLACE PROCEDURE sp_registrar_actuador(
 p_proyecto_id INT,p_nodo_id INT,p_nombre VARCHAR,p_pin INT,p_duracion_maxima INT,INOUT p_actuador_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM tb_nodo_iot n JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id WHERE n.id=p_nodo_id AND f.tb_proyecto_id=p_proyecto_id) THEN RAISE EXCEPTION 'El nodo no pertenece al proyecto.'; END IF;
 IF p_pin NOT BETWEEN 0 AND 39 THEN RAISE EXCEPTION 'El GPIO no es válido.'; END IF;
 IF p_duracion_maxima NOT BETWEEN 1 AND 600 THEN RAISE EXCEPTION 'La duración máxima debe estar entre 1 y 600 segundos.'; END IF;
 INSERT INTO tb_actuador(tb_proyecto_id,nombre,tipo_actuador,activo_en_low,duracion_maxima_segundos)
 VALUES(p_proyecto_id,trim(p_nombre),'VALVULA',TRUE,p_duracion_maxima) RETURNING id INTO p_actuador_id;
 INSERT INTO tb_nodo_actuador(tb_nodo_id,tb_actuador_id,pin_control,es_principal) VALUES(p_nodo_id,p_actuador_id,p_pin,TRUE);
END;$$;
