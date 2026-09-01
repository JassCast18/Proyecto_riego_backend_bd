DROP FUNCTION IF EXISTS fn_listar_comparacion_ciclos(INT,INT);
CREATE OR REPLACE FUNCTION fn_listar_comparacion_ciclos(p_proyecto_id INT,p_usuario_id INT)
RETURNS TABLE(
    ciclo_id INT,numero_ciclo INT,cultivo VARCHAR,variedad VARCHAR,fecha_inicio DATE,fecha_fin DATE,
    estado VARCHAR,dias_transcurridos INT,total_informes BIGINT,altura_promedio DECIMAL,
    hojas_promedio DECIMAL,temperatura_promedio DECIMAL,humedad_promedio DECIMAL,
    dias_primer_brote INT,porcentaje_brote DECIMAL,resultado_final VARCHAR,
    cantidad_cosechada DECIMAL,unidad_cosecha VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_id AND sn_activo=TRUE) THEN RAISE EXCEPTION 'No tienes acceso a este proyecto.'; END IF;
    RETURN QUERY SELECT cc.id,cc.numero_ciclo,cu.nombre,cc.variedad,cc.fecha_inicio,cc.fecha_fin,cc.estado,
      GREATEST(0,(COALESCE(cc.fecha_fin,CURRENT_DATE)-COALESCE(cc.fecha_inicio,cc.fecha_registra::DATE)))::INT,
      COUNT(DISTINCT i.id),ROUND(AVG(d.altura_planta_cm),2),ROUND(AVG(d.cantidad_hojas),2),
      ROUND((SELECT AVG(t.valor_lectura) FROM tb_telemetria t JOIN tb_sensor sa ON sa.id=t.tb_sensor_id
        JOIN tb_nodo_iot n ON n.id=sa.tb_nodo_id JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id
        WHERE f.tb_proyecto_id=p_proyecto_id AND sa.tipo_componente ILIKE '%Termometro%'
          AND t.fecha_hora::DATE>=COALESCE(cc.fecha_inicio,cc.fecha_registra::DATE) AND t.fecha_hora::DATE<=COALESCE(cc.fecha_fin,CURRENT_DATE)),2),
      ROUND((SELECT AVG(t.valor_lectura) FROM tb_telemetria t JOIN tb_sensor sa ON sa.id=t.tb_sensor_id
        JOIN tb_nodo_iot n ON n.id=sa.tb_nodo_id JOIN tb_sector s ON s.id=n.tb_sector_id JOIN tb_finca f ON f.id=s.tb_finca_id
        WHERE f.tb_proyecto_id=p_proyecto_id AND sa.tipo_componente ILIKE '%Higrometro%'
          AND t.fecha_hora::DATE>=COALESCE(cc.fecha_inicio,cc.fecha_registra::DATE) AND t.fecha_hora::DATE<=COALESCE(cc.fecha_fin,CURRENT_DATE)),2),
      CASE WHEN cc.fecha_primer_brote IS NULL THEN NULL ELSE GREATEST(0,cc.fecha_primer_brote-COALESCE(cc.fecha_inicio,cc.fecha_registra::DATE))::INT END,
      cc.porcentaje_brote,cc.resultado_final,cc.cantidad_cosechada,cc.unidad_cosecha
    FROM tb_ciclo_cultivo cc JOIN tb_cultivo cu ON cu.id=cc.tb_cultivo_id
    LEFT JOIN tb_informe_supervision i ON i.tb_ciclo_cultivo_id=cc.id LEFT JOIN tb_datos_fenologicos d ON d.tb_informe_id=i.id
    WHERE cc.tb_proyecto_id=p_proyecto_id GROUP BY cc.id,cu.nombre ORDER BY cc.numero_ciclo;
END;
$$;
