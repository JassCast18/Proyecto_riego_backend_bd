CREATE OR REPLACE PROCEDURE sp_iniciar_prueba_control_manual(
  IN p_proyecto_id INT,IN p_usuario_id INT,IN p_nodo_id INT,IN p_tipo VARCHAR,
  IN p_componente_id INT,IN p_objetivo VARCHAR,IN p_intervalo_segundos INT,
  IN p_duracion_segundos INT,INOUT p_prueba_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE v_pin INT;v_low BOOLEAN;v_max INT;v_tipo VARCHAR:=upper(trim(p_tipo));
BEGIN
  IF p_intervalo_segundos NOT BETWEEN 5 AND 60 THEN RAISE EXCEPTION 'El intervalo debe estar entre 5 y 60 segundos.'; END IF;
  IF p_duracion_segundos NOT BETWEEN 30 AND 600 THEN RAISE EXCEPTION 'La duración debe estar entre 30 y 600 segundos.'; END IF;
  IF EXISTS(SELECT 1 FROM tb_prueba_unitaria WHERE tb_nodo_id=p_nodo_id AND estado IN('ESPERANDO','EN_CURSO','DETENIENDO')) THEN
    RAISE EXCEPTION 'El nodo ya tiene una prueba activa.';
  END IF;
  IF v_tipo='SENSOR' THEN
    IF NOT EXISTS(SELECT 1 FROM tb_sensor s JOIN tb_nodo_iot n ON n.id=s.tb_nodo_id JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id WHERE s.id=p_componente_id AND s.tb_nodo_id=p_nodo_id AND f.tb_proyecto_id=p_proyecto_id) THEN RAISE EXCEPTION 'El sensor no pertenece al nodo y proyecto.'; END IF;
  ELSIF v_tipo='ACTUADOR' THEN
    SELECT na.pin_control,a.activo_en_low,a.duracion_maxima_segundos INTO v_pin,v_low,v_max
    FROM tb_nodo_actuador na JOIN tb_actuador a ON a.id=na.tb_actuador_id
    WHERE na.tb_nodo_id=p_nodo_id AND a.id=p_componente_id AND a.tb_proyecto_id=p_proyecto_id AND na.sn_activo AND a.sn_activo;
    IF v_pin IS NULL THEN RAISE EXCEPTION 'El actuador no está vinculado al nodo.'; END IF;
    IF p_duracion_segundos>v_max THEN RAISE EXCEPTION 'La duración supera el límite seguro del actuador.'; END IF;
  ELSE RAISE EXCEPTION 'Tipo de prueba no válido.'; END IF;

  INSERT INTO tb_prueba_unitaria(tb_proyecto_id,tb_nodo_id,tb_usuario_id,tipo_prueba,tb_sensor_id,tb_actuador_id,objetivo,intervalo_segundos,duracion_segundos,estado)
  VALUES(p_proyecto_id,p_nodo_id,p_usuario_id,v_tipo,CASE WHEN v_tipo='SENSOR' THEN p_componente_id END,CASE WHEN v_tipo='ACTUADOR' THEN p_componente_id END,NULLIF(trim(p_objetivo),''),p_intervalo_segundos,p_duracion_segundos,'ESPERANDO') RETURNING id INTO p_prueba_id;
  INSERT INTO tb_comando_iot(tb_proyecto_id,tb_nodo_id,tb_prueba_id,tipo_comando,payload,fecha_expiracion)
  VALUES(p_proyecto_id,p_nodo_id,p_prueba_id,CASE WHEN v_tipo='SENSOR' THEN 'INICIAR_PRUEBA_SENSOR' ELSE 'ACTIVAR_ACTUADOR' END,
    jsonb_build_object('pruebaId',p_prueba_id,'intervaloSegundos',p_intervalo_segundos,'duracionSegundos',p_duracion_segundos,'componenteId',p_componente_id,'pin',COALESCE(v_pin,5),'activoEnLow',COALESCE(v_low,TRUE)),NOW()+INTERVAL '5 minutes');
END;$$;
