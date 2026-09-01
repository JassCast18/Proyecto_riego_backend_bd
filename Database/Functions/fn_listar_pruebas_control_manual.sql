CREATE OR REPLACE FUNCTION fn_listar_pruebas_control_manual(p_proyecto_id INT,p_tipo VARCHAR DEFAULT NULL,p_limite INT DEFAULT 30)
RETURNS TABLE(id INT,tipo_prueba VARCHAR,estado VARCHAR,nodo VARCHAR,componente VARCHAR,
  usuario VARCHAR,objetivo VARCHAR,intervalo_segundos INT,duracion_segundos INT,resultado VARCHAR,
  conclusion VARCHAR,fecha_hora TIMESTAMP,fecha_inicio TIMESTAMP,fecha_fin TIMESTAMP,
  total_lecturas BIGINT,valor_minimo DECIMAL,valor_maximo DECIMAL,valor_promedio DECIMAL)
LANGUAGE sql
AS $$
  SELECT fn_sincronizar_pruebas_actuador(p_proyecto_id,NULL);
  SELECT p.id,p.tipo_prueba,p.estado,('Nodo #'||p.tb_nodo_id)::VARCHAR,
    COALESCE(s.nombre,s.tipo_componente,a.nombre)::VARCHAR,
    concat_ws(' ',pe.nombres,pe.apellidos)::VARCHAR,p.objetivo,p.intervalo_segundos,p.duracion_segundos,
    p.resultado,p.conclusion,p.fecha_hora,p.fecha_inicio,p.fecha_fin,count(l.id),
    min(l.valor_lectura),max(l.valor_lectura),round(avg(l.valor_lectura),2)
  FROM tb_prueba_unitaria p
  JOIN tb_usuario u ON u.id=p.tb_usuario_id JOIN tb_persona pe ON pe.id=u.tb_persona_id
  LEFT JOIN tb_sensor s ON s.id=p.tb_sensor_id LEFT JOIN tb_actuador a ON a.id=p.tb_actuador_id
  LEFT JOIN tb_prueba_lectura l ON l.tb_prueba_id=p.id
  WHERE p.tb_proyecto_id=p_proyecto_id AND (p_tipo IS NULL OR upper(p.tipo_prueba)=upper(p_tipo))
  GROUP BY p.id,s.nombre,s.tipo_componente,a.nombre,pe.nombres,pe.apellidos
  ORDER BY p.fecha_hora DESC LIMIT LEAST(GREATEST(COALESCE(p_limite,30),1),100);
$$;
