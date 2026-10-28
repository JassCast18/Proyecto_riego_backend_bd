CREATE OR REPLACE PROCEDURE sp_depurar_notificaciones(p_proyecto_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM tb_notificacion
  WHERE tb_proyecto_id=p_proyecto_id
    AND severidad<>'CRITICAL'
    AND (
      (estado='RESUELTA' AND fecha_actualizacion < NOW()-INTERVAL '7 days')
      OR (severidad='INFO' AND estado<>'ACTIVA' AND fecha_actualizacion < NOW()-INTERVAL '7 days')
      OR (severidad='WARNING' AND estado<>'ACTIVA' AND fecha_actualizacion < NOW()-INTERVAL '30 days')
    );
END;
$$;
