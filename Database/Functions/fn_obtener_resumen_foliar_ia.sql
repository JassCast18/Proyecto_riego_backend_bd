CREATE OR REPLACE FUNCTION fn_obtener_resumen_foliar_ia(p_proyecto_id INT)
RETURNS JSONB
LANGUAGE sql AS $$
WITH observaciones AS (
  SELECT i.id,i.fecha_observacion,i.fecha_registra,d.color_hojas_raw,
    fn_puntaje_color_hojas(d.color_hojas_raw) puntaje
  FROM tb_informe_supervision i
  JOIN tb_datos_fenologicos d ON d.tb_informe_id=i.id
  WHERE i.tb_proyecto_id=p_proyecto_id
    AND fn_puntaje_color_hojas(d.color_hojas_raw) IS NOT NULL
), recientes AS (
  SELECT * FROM observaciones ORDER BY fecha_observacion DESC,fecha_registra DESC,id DESC LIMIT 5
)
SELECT jsonb_build_object(
  'referenciaSaludable',85,
  'promedioReciente',COALESCE(ROUND((SELECT AVG(puntaje) FROM recientes),1),85),
  'promedioHistorico',ROUND((SELECT AVG(puntaje) FROM observaciones),1),
  'muestrasRecientes',(SELECT COUNT(*) FROM recientes),
  'totalInformes',(SELECT COUNT(*) FROM observaciones),
  'usaReferencia',NOT EXISTS(SELECT 1 FROM recientes),
  'ultimoColor',(SELECT color_hojas_raw FROM recientes ORDER BY fecha_observacion DESC,fecha_registra DESC,id DESC LIMIT 1),
  'ultimaFecha',(SELECT fecha_observacion FROM recientes ORDER BY fecha_observacion DESC,fecha_registra DESC,id DESC LIMIT 1),
  'ultimos',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'color',color_hojas_raw,'puntaje',puntaje,'fecha',fecha_observacion) ORDER BY fecha_observacion DESC,fecha_registra DESC,id DESC) FROM recientes),'[]'::jsonb)
);
$$;
