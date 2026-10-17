CREATE OR REPLACE PROCEDURE sp_registrar_decision_ia(IN p_proyecto_id INT,IN p_nodo_id INT,IN p_modelo_id INT,IN p_decision VARCHAR,IN p_confianza DECIMAL,IN p_variables JSONB,IN p_explicacion VARCHAR,INOUT p_decision_id BIGINT DEFAULT NULL)
LANGUAGE plpgsql AS $$
BEGIN
 IF UPPER(TRIM(p_decision))='REGAR' AND NOT EXISTS(
   SELECT 1
   FROM tb_nodo_actuador na
   JOIN tb_actuador a ON a.id=na.tb_actuador_id
   JOIN tb_nodo_iot n ON n.id=na.tb_nodo_id
   JOIN tb_sector se ON se.id=n.tb_sector_id
   JOIN tb_finca f ON f.id=se.tb_finca_id
   WHERE na.tb_nodo_id=p_nodo_id AND na.sn_activo=TRUE
     AND a.sn_activo=TRUE AND a.tb_proyecto_id=p_proyecto_id
     AND f.tb_proyecto_id=p_proyecto_id
 ) THEN
   RAISE EXCEPTION 'La IA no puede recomendar riego para un nodo sin actuador activo.';
 END IF;
 UPDATE tb_decision_ia SET estado='CANCELADA',observacion_resolucion='Reemplazada por una evaluación más reciente',fecha_resolucion=NOW()
 WHERE tb_proyecto_id=p_proyecto_id AND tb_nodo_id=p_nodo_id AND estado='PENDIENTE';
 INSERT INTO tb_decision_ia(tb_proyecto_id,tb_nodo_id,tb_version_modelo_id,decision,confianza,variables_entrada,explicacion,estado)
 VALUES(p_proyecto_id,p_nodo_id,p_modelo_id,p_decision,p_confianza,p_variables,p_explicacion,'PENDIENTE') RETURNING id INTO p_decision_id;
 INSERT INTO tb_notificacion(clave_evento,tb_proyecto_id,tb_nodo_id,categoria,tipo,titulo,mensaje,severidad,estado,descartable)
 VALUES('IA:DECISION:'||p_decision_id,p_proyecto_id,p_nodo_id,'IA','IA_RECOMENDACION',
   CASE WHEN p_decision='REGAR' THEN 'La IA recomienda regar' ELSE 'La IA recomienda no regar' END,
   COALESCE(p_explicacion,'Revisa y confirma la recomendación desde Inteligencia artificial.'),'INFO','ACTIVA',TRUE);
 UPDATE tb_configuracion_ia SET ultima_evaluacion=NOW() WHERE tb_proyecto_id=p_proyecto_id;
END; $$;

UPDATE tb_decision_ia d
SET estado='PENDIENTE'
WHERE d.estado='REGISTRADA'
  AND d.decision='NO_REGAR'
  AND d.id IN (
    SELECT MAX(id) FROM tb_decision_ia
    WHERE estado='REGISTRADA' AND decision='NO_REGAR'
    GROUP BY tb_proyecto_id,tb_nodo_id
  );
