CREATE OR REPLACE FUNCTION fn_listar_actuadores_ia(p_proyecto_id INT)
RETURNS TABLE(nodo_id INT,nodo VARCHAR,actuador_id INT,actuador VARCHAR,pin INT,duracion_maxima INT,estado VARCHAR)
LANGUAGE sql AS $$
 SELECT n.id,n.tipo_nodo,a.id,a.nombre,na.pin_control,a.duracion_maxima_segundos,a.estado_actual
 FROM tb_nodo_iot n JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
 JOIN tb_nodo_actuador na ON na.tb_nodo_id=n.id AND na.sn_activo
 JOIN tb_actuador a ON a.id=na.tb_actuador_id AND a.sn_activo
 WHERE f.tb_proyecto_id=p_proyecto_id ORDER BY n.id,na.es_principal DESC,a.id;
$$;
