CREATE OR REPLACE FUNCTION fn_listar_catalogo_control_manual(p_proyecto_id INT)
RETURNS TABLE(nodo_id INT,tipo_nodo VARCHAR,direccion_mac VARCHAR,estado_energia VARCHAR,sensores JSONB,actuadores JSONB)
LANGUAGE sql
AS $$
  SELECT n.id,n.tipo_nodo,n.direccion_mac,n.estado_energia,
    COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id',s.id,'nombre',COALESCE(s.nombre,s.tipo_componente),'tipo',s.tipo_componente,
      'unidad',s.unidad,'recomendacion',s.recomendacion_prueba) ORDER BY s.id)
      FROM tb_sensor s WHERE s.tb_nodo_id=n.id AND s.sn_activo=TRUE),'[]'::JSONB),
    COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id',a.id,'nombre',a.nombre,'tipo',a.tipo_actuador,'estado',a.estado_actual,
      'duracionMaxima',a.duracion_maxima_segundos,'pin',na.pin_control,
      'principal',na.es_principal,'activoEnLow',a.activo_en_low) ORDER BY a.id)
      FROM tb_nodo_actuador na JOIN tb_actuador a ON a.id=na.tb_actuador_id
      WHERE na.tb_nodo_id=n.id AND na.sn_activo=TRUE AND a.sn_activo=TRUE),'[]'::JSONB)
  FROM tb_nodo_iot n JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id
  WHERE f.tb_proyecto_id=p_proyecto_id ORDER BY n.id;
$$;
