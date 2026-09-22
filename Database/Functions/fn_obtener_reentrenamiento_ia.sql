CREATE OR REPLACE FUNCTION fn_obtener_reentrenamiento_ia(p_proyecto_id INT)
RETURNS JSONB
LANGUAGE sql AS $$
WITH decisiones AS (
  SELECT d.*,
    CASE
      WHEN d.estado IN ('ACEPTADA','COMPLETADA') THEN d.decision
      WHEN d.estado='RECHAZADA' AND d.decision='REGAR' THEN 'NO_REGAR'
      WHEN d.estado='RECHAZADA' AND d.decision='NO_REGAR' THEN 'REGAR'
    END AS etiqueta_corregida
  FROM tb_decision_ia d
  WHERE d.tb_proyecto_id=p_proyecto_id
), resumen AS (
  SELECT COUNT(*) total,
    COUNT(*) FILTER (WHERE decision='REGAR') regar,
    COUNT(*) FILTER (WHERE decision='NO_REGAR') no_regar,
    COUNT(*) FILTER (WHERE estado IN ('ACEPTADA','COMPLETADA')) aceptadas,
    COUNT(*) FILTER (WHERE estado='RECHAZADA') rechazadas,
    COUNT(*) FILTER (WHERE etiqueta_corregida IS NOT NULL) revisadas
  FROM decisiones
), por_version AS (
  SELECT v.id,v.version,v.estado,v.sn_activo,v.fecha_entrenamiento,v.exactitud,v.total_muestras,
    COUNT(d.id) total_decisiones,
    COUNT(d.id) FILTER (WHERE d.decision='REGAR') decisiones_regar,
    COUNT(d.id) FILTER (WHERE d.decision='NO_REGAR') decisiones_no_regar,
    COUNT(d.id) FILTER (WHERE d.estado IN ('ACEPTADA','COMPLETADA')) aceptadas,
    COUNT(d.id) FILTER (WHERE d.estado='RECHAZADA') rechazadas
  FROM tb_version_modelo_ia v
  LEFT JOIN decisiones d ON d.tb_version_modelo_id=v.id
  WHERE v.tb_proyecto_id=p_proyecto_id
  GROUP BY v.id
  ORDER BY v.fecha_entrenamiento DESC
), telemetria_entrenable AS (
  SELECT th.fecha_hora
  FROM tb_telemetria th
  JOIN tb_sensor sh ON sh.id=th.tb_sensor_id
  JOIN tb_nodo_iot n ON n.id=sh.tb_nodo_id
  JOIN tb_sector se ON se.id=n.tb_sector_id
  JOIN tb_finca f ON f.id=se.tb_finca_id
  JOIN tb_proyecto_cultivo pc ON pc.tb_proyecto_id=f.tb_proyecto_id
  WHERE f.tb_proyecto_id=p_proyecto_id
    AND (sh.tipo_componente ILIKE '%higr%' OR sh.tipo_componente ILIKE '%hum%')
    AND pc.humedad_suelo_minima IS NOT NULL
    AND pc.humedad_suelo_maxima IS NOT NULL
)
SELECT jsonb_build_object(
  'resumen',jsonb_build_object(
    'total',r.total,'regar',r.regar,'noRegar',r.no_regar,'aceptadas',r.aceptadas,'rechazadas',r.rechazadas,'revisadas',r.revisadas,
    'porcentajeRegar',CASE WHEN r.total=0 THEN 0 ELSE ROUND(r.regar*100.0/r.total,1) END,
    'porcentajeNoRegar',CASE WHEN r.total=0 THEN 0 ELSE ROUND(r.no_regar*100.0/r.total,1) END,
    'porcentajeAcuerdo',CASE WHEN r.revisadas=0 THEN 0 ELSE ROUND(r.aceptadas*100.0/r.revisadas,1) END
  ),
  'versiones',COALESCE((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.fecha_entrenamiento DESC) FROM por_version v),'[]'::jsonb),
  'correcciones',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.fecha_resolucion DESC) FROM (
    SELECT id,tb_nodo_id,tb_version_modelo_id,decision,etiqueta_corregida,estado,confianza,observacion_resolucion,fecha_hora,fecha_resolucion
    FROM decisiones WHERE etiqueta_corregida IS NOT NULL ORDER BY fecha_resolucion DESC LIMIT 20
  ) x),'[]'::jsonb),
  'arbol',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.fecha_hora ASC,x.id ASC) FROM (
    SELECT d.id,d.tb_nodo_id,d.tb_version_modelo_id,d.decision,d.etiqueta_corregida,d.estado,d.confianza,
      d.variables_entrada,d.explicacion,d.fecha_hora,d.fecha_resolucion,
      LEAST(5000,(SELECT COUNT(*) FROM telemetria_entrenable t WHERE t.fecha_hora<=d.fecha_hora))::INT AS muestras_historicas,
      (SELECT COUNT(*) FROM telemetria_entrenable t WHERE t.fecha_hora>d.fecha_hora)::INT AS muestras_posteriores,
      LEAST(500,(SELECT COUNT(*) FROM decisiones f
        WHERE f.fecha_hora<=d.fecha_hora
          AND f.estado IN ('ACEPTADA','COMPLETADA','RECHAZADA')
          AND f.variables_entrada ?& ARRAY['humedad','temperatura','hora','dias_cultivo','humedad_minima','humedad_maxima']))::INT AS correcciones_humanas,
      51::INT AS muestras_referencia,
      (d.id=(SELECT z.id FROM decisiones z ORDER BY z.fecha_hora DESC,z.id DESC LIMIT 1)) AS es_ultima,
      (d.id=(SELECT v.tb_decision_base_id FROM tb_version_modelo_ia v
        WHERE v.tb_proyecto_id=p_proyecto_id AND v.sn_activo
        ORDER BY v.fecha_entrenamiento DESC LIMIT 1)) AS es_base_modelo
    FROM decisiones d ORDER BY d.fecha_hora DESC,d.id DESC LIMIT 10
  ) x),'[]'::jsonb)
) FROM resumen r;
$$;
