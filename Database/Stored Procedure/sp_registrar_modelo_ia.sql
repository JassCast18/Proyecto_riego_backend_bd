CREATE OR REPLACE PROCEDURE sp_registrar_modelo_ia(IN p_proyecto_id INT,IN p_usuario_id INT,IN p_ruta VARCHAR,IN p_version VARCHAR,IN p_algoritmo VARCHAR,IN p_muestras INT,IN p_exactitud DECIMAL,IN p_precision DECIMAL,IN p_sensibilidad DECIMAL,IN p_importancia JSONB,INOUT p_modelo_id INT DEFAULT NULL)
LANGUAGE plpgsql AS $$
BEGIN
 UPDATE tb_version_modelo_ia SET sn_activo=FALSE,estado='RETIRADO' WHERE tb_proyecto_id=p_proyecto_id;
 INSERT INTO tb_version_modelo_ia(tb_proyecto_id,tb_usuario_id,ruta_pesos_algoritmo,version,algoritmo,estado,total_muestras,exactitud,precision_modelo,sensibilidad,importancia_variables,sn_activo)
 VALUES(p_proyecto_id,p_usuario_id,p_ruta,p_version,p_algoritmo,'EN_REVISION',p_muestras,p_exactitud,p_precision,p_sensibilidad,p_importancia,TRUE) RETURNING id INTO p_modelo_id;
 INSERT INTO tb_configuracion_ia(tb_proyecto_id,modo,cod_usuario_modifica) VALUES(p_proyecto_id,'SUPERVISADO',p_usuario_id)
 ON CONFLICT(tb_proyecto_id) DO UPDATE SET modo='SUPERVISADO',cod_usuario_modifica=p_usuario_id,fecha_modifica=NOW();
 INSERT INTO tb_bitacora_auditoria(tb_proyecto_id,tb_usuario_id,accion_realizada,categoria,origen,entidad,entidad_id,detalle)
 VALUES(p_proyecto_id,p_usuario_id,'Modelo de IA entrenado','IA','USUARIO','tb_version_modelo_ia',p_modelo_id,CONCAT('Modelo ',p_version,' entrenado con ',p_muestras,' muestras'));
END; $$;
