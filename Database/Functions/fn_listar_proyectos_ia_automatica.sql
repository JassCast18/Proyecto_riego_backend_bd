CREATE OR REPLACE FUNCTION fn_listar_proyectos_ia_automatica()
RETURNS TABLE(proyecto_id INT,duracion_segundos INT) LANGUAGE sql AS $$
 SELECT c.tb_proyecto_id,c.duracion_riego_segundos FROM tb_configuracion_ia c
 WHERE c.estrategia_decision='IA' AND c.modo='AUTOMATICO' AND (c.ultima_evaluacion IS NULL OR c.ultima_evaluacion+make_interval(mins=>c.intervalo_evaluacion_minutos)<=NOW());
$$;
