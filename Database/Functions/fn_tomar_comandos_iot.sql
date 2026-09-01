CREATE OR REPLACE FUNCTION fn_tomar_comandos_iot(p_nodo_id INT)
RETURNS TABLE(id BIGINT,tipo_comando VARCHAR,payload JSONB)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tb_comando_iot SET estado='EXPIRADO'
  WHERE tb_nodo_id=p_nodo_id AND estado IN('PENDIENTE','ENTREGADO') AND fecha_expiracion<NOW();
  PERFORM fn_sincronizar_pruebas_actuador(NULL,p_nodo_id);
  RETURN QUERY
  WITH elegidos AS (
    SELECT c.id FROM tb_comando_iot c
    WHERE c.tb_nodo_id=p_nodo_id AND c.estado IN('PENDIENTE','ENTREGADO') AND c.intentos<5
    ORDER BY c.fecha_creacion LIMIT 5 FOR UPDATE SKIP LOCKED
  ), actualizados AS (
    UPDATE tb_comando_iot c SET estado='ENTREGADO',intentos=c.intentos+1,fecha_entrega=NOW()
    FROM elegidos e WHERE c.id=e.id RETURNING c.id,c.tipo_comando,c.payload
  ) SELECT a.id,a.tipo_comando,a.payload FROM actualizados a;
END;
$$;
