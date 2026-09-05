CREATE OR REPLACE FUNCTION fn_sincronizar_pruebas_actuador(
  p_proyecto_id INT DEFAULT NULL,
  p_nodo_id INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prueba RECORD;
  v_actualizadas INT := 0;
BEGIN
  FOR v_prueba IN
    SELECT p.id,p.tb_proyecto_id,p.tb_nodo_id,p.tb_sensor_id,p.tb_actuador_id,
           p.tipo_prueba,p.estado,p.fecha_inicio,p.duracion_segundos
    FROM tb_prueba_unitaria p
    WHERE p.estado IN('ESPERANDO','EN_CURSO')
      AND (p_proyecto_id IS NULL OR p.tb_proyecto_id=p_proyecto_id)
      AND (p_nodo_id IS NULL OR p.tb_nodo_id=p_nodo_id)
      AND (
        (p.estado='EN_CURSO' AND p.fecha_inicio IS NOT NULL
          AND p.fecha_inicio + make_interval(secs=>p.duracion_segundos) <= NOW())
        OR
        (p.estado='ESPERANDO' AND EXISTS (
          SELECT 1 FROM tb_comando_iot c
          WHERE c.tb_prueba_id=p.id
            AND c.tipo_comando=CASE WHEN p.tipo_prueba='ACTUADOR' THEN 'ACTIVAR_ACTUADOR' ELSE 'INICIAR_PRUEBA_SENSOR' END
            AND (c.estado IN('FALLIDO','EXPIRADO') OR c.fecha_expiracion<NOW())
        ))
      )
    FOR UPDATE OF p SKIP LOCKED
  LOOP
    IF v_prueba.estado='EN_CURSO' THEN
      UPDATE tb_prueba_unitaria
      SET estado='PENDIENTE_REVISION',resultado=NULL,
          conclusion=COALESCE(conclusion,'La ventana programada terminó y se solicitó el cierre automático del actuador.'),
          fecha_fin=NOW(),ultima_comunicacion=NOW()
      WHERE id=v_prueba.id;

      INSERT INTO tb_comando_iot(
        tb_proyecto_id,tb_nodo_id,tb_prueba_id,tipo_comando,payload,fecha_expiracion
      )
      SELECT v_prueba.tb_proyecto_id,v_prueba.tb_nodo_id,v_prueba.id,
        CASE WHEN v_prueba.tipo_prueba='ACTUADOR' THEN 'DESACTIVAR_ACTUADOR' ELSE 'FINALIZAR_PRUEBA' END,
        jsonb_build_object('pruebaId',v_prueba.id,'intervaloSegundos',900,
          'componenteId',COALESCE(v_prueba.tb_actuador_id,v_prueba.tb_sensor_id)),
        NOW()+INTERVAL '5 minutes'
      WHERE NOT EXISTS (
        SELECT 1 FROM tb_comando_iot
        WHERE tb_prueba_id=v_prueba.id
          AND tipo_comando=CASE WHEN v_prueba.tipo_prueba='ACTUADOR' THEN 'DESACTIVAR_ACTUADOR' ELSE 'FINALIZAR_PRUEBA' END
      );

      IF v_prueba.tipo_prueba='ACTUADOR' THEN
        UPDATE tb_actuador SET estado_actual='INACTIVO' WHERE id=v_prueba.tb_actuador_id;
      END IF;

      INSERT INTO tb_notificacion(
        clave_evento,tb_proyecto_id,tb_nodo_id,categoria,tipo,titulo,mensaje,
        severidad,estado,descartable,fecha_primera_deteccion,fecha_ultima_deteccion
      ) VALUES(
        'PRUEBA_CONTROL_MANUAL:'||v_prueba.id,v_prueba.tb_proyecto_id,v_prueba.tb_nodo_id,
        'CONTROL_MANUAL','PRUEBA_CONTROL_MANUAL_'||v_prueba.tipo_prueba||'_'||v_prueba.id,
        'Prueba pendiente de calificación',
        'La prueba #'||v_prueba.id||' terminó su tiempo programado. Abre este aviso para registrar el resultado.',
        'INFO','ACTIVA',FALSE,NOW(),NOW()
      ) ON CONFLICT(clave_evento) WHERE estado IN('PENDIENTE','ACTIVA','RECONOCIDA')
        DO UPDATE SET fecha_actualizacion=NOW(),fecha_ultima_deteccion=NOW();
    ELSE
      UPDATE tb_prueba_unitaria
      SET estado='FALLIDA',resultado='NO_EJECUTADA',
          conclusion=COALESCE(conclusion,'El nodo no confirmó la orden de activación dentro del tiempo permitido.'),
          fecha_fin=NOW()
      WHERE id=v_prueba.id;
    END IF;

    v_actualizadas := v_actualizadas + 1;
  END LOOP;

  RETURN v_actualizadas;
END;
$$;
