CREATE OR REPLACE FUNCTION fn_obtener_prueba_control_manual(p_prueba_id INT,p_proyecto_id INT)
RETURNS TABLE(prueba JSONB)
LANGUAGE sql AS $$
 SELECT fn_sincronizar_pruebas_actuador(p_proyecto_id,NULL);
 SELECT jsonb_build_object(
   'id',p.id,'tipoPrueba',p.tipo_prueba,'estado',p.estado,'nodoId',p.tb_nodo_id,
   'sensorId',p.tb_sensor_id,'actuadorId',p.tb_actuador_id,'objetivo',p.objetivo,
   'intervaloSegundos',p.intervalo_segundos,'duracionSegundos',p.duracion_segundos,
   'resultado',p.resultado,'conclusion',p.conclusion,'fechaInicio',p.fecha_inicio,
   'fechaFin',p.fecha_fin,'ultimaComunicacion',p.ultima_comunicacion,
   'componenteNombre',COALESCE(s.nombre,s.tipo_componente,a.nombre),
   'pinControl',na.pin_control,'activoEnLow',a.activo_en_low,
   'lecturas',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',l.id,'valor',l.valor_lectura,'fechaHora',l.fecha_hora) ORDER BY l.fecha_hora,l.id) FROM tb_prueba_lectura l WHERE l.tb_prueba_id=p.id),'[]'::JSONB),
   'comandos',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'tipo',c.tipo_comando,'estado',c.estado,'mensaje',c.mensaje_confirmacion,'fecha',c.fecha_creacion,'fechaConfirmacion',c.fecha_confirmacion) ORDER BY c.id) FROM tb_comando_iot c WHERE c.tb_prueba_id=p.id),'[]'::JSONB)
 ) FROM tb_prueba_unitaria p
 LEFT JOIN tb_sensor s ON s.id=p.tb_sensor_id
 LEFT JOIN tb_actuador a ON a.id=p.tb_actuador_id
 LEFT JOIN LATERAL (
   SELECT relacion.pin_control FROM tb_nodo_actuador relacion
   WHERE relacion.tb_actuador_id=p.tb_actuador_id AND relacion.tb_nodo_id=p.tb_nodo_id AND relacion.sn_activo=TRUE
   ORDER BY relacion.es_principal DESC LIMIT 1
 ) na ON TRUE
 WHERE p.id=p_prueba_id AND p.tb_proyecto_id=p_proyecto_id;
$$;
