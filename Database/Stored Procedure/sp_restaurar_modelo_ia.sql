CREATE OR REPLACE PROCEDURE sp_restaurar_modelo_ia(
  IN p_proyecto_id INT,IN p_modelo_id INT,IN p_usuario_id INT,IN p_motivo VARCHAR
)
LANGUAGE plpgsql AS $$
DECLARE v_modelo tb_version_modelo_ia%ROWTYPE;v_anterior INT;
BEGIN
  IF length(trim(COALESCE(p_motivo,'')))<10 THEN
    RAISE EXCEPTION 'Explica en al menos 10 caracteres por qué restauras esta versión.';
  END IF;
  PERFORM pg_advisory_xact_lock(6200,p_proyecto_id);
  SELECT id INTO v_anterior FROM tb_version_modelo_ia WHERE tb_proyecto_id=p_proyecto_id AND sn_activo LIMIT 1;
  SELECT * INTO v_modelo FROM tb_version_modelo_ia WHERE id=p_modelo_id AND tb_proyecto_id=p_proyecto_id FOR UPDATE;
  IF v_modelo.id IS NULL THEN RAISE EXCEPTION 'La versión seleccionada no pertenece al proyecto.'; END IF;
  IF v_modelo.ruta_pesos_algoritmo IS NULL THEN RAISE EXCEPTION 'La versión seleccionada no tiene un archivo de modelo asociado.'; END IF;
  IF v_modelo.sn_activo THEN RAISE EXCEPTION 'La versión seleccionada ya está activa.'; END IF;

  UPDATE tb_decision_ia SET estado='CANCELADA',fecha_resolucion=NOW(),observacion_resolucion='Cancelada al restaurar otra versión del modelo.'
  WHERE tb_proyecto_id=p_proyecto_id AND estado='PENDIENTE';
  UPDATE tb_version_modelo_ia SET sn_activo=FALSE,estado='RETIRADO' WHERE tb_proyecto_id=p_proyecto_id;
  UPDATE tb_version_modelo_ia SET sn_activo=TRUE,estado='EN_REVISION' WHERE id=p_modelo_id;
  UPDATE tb_configuracion_ia SET modo='SUPERVISADO',cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW()
  WHERE tb_proyecto_id=p_proyecto_id;
  INSERT INTO tb_bitacora_auditoria(tb_proyecto_id,tb_usuario_id,accion_realizada,categoria,origen,entidad,entidad_id,detalle,valores_anteriores,valores_nuevos)
  VALUES(p_proyecto_id,p_usuario_id,'Versión de IA restaurada','IA','USUARIO','tb_version_modelo_ia',p_modelo_id,trim(p_motivo),
    jsonb_build_object('modelo_id',v_anterior),jsonb_build_object('modelo_id',p_modelo_id,'version',v_modelo.version,'estado','EN_REVISION'));
  INSERT INTO tb_notificacion(clave_evento,tb_proyecto_id,categoria,tipo,titulo,mensaje,severidad,estado,descartable)
  VALUES('IA:MODELO:RESTAURADO:'||p_modelo_id||':'||extract(epoch from now())::BIGINT,p_proyecto_id,'IA','IA_MODELO_RESTAURADO',
    'Versión anterior de IA restaurada','La versión '||COALESCE(v_modelo.version,p_modelo_id::TEXT)||' quedó activa en modo supervisado.','INFO','ACTIVA',TRUE);
END; $$;
