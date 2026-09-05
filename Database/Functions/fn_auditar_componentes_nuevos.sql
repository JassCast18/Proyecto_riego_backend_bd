CREATE OR REPLACE FUNCTION fn_auditar_sensor_nuevo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_proyecto INT;
BEGIN
 SELECT f.tb_proyecto_id INTO v_proyecto FROM tb_nodo_iot n JOIN tb_sector se ON se.id=n.tb_sector_id JOIN tb_finca f ON f.id=se.tb_finca_id WHERE n.id=NEW.tb_nodo_id;
 INSERT INTO tb_bitacora_auditoria(accion_realizada,fecha_hora,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_nuevos)
 VALUES('Sensor registrado',NOW(),v_proyecto,'INFRAESTRUCTURA','USUARIO','tb_sensor',NEW.id,
   'Se agregó el sensor '||COALESCE(NEW.nombre,NEW.tipo_componente)||' al nodo #'||NEW.tb_nodo_id,
   jsonb_build_object('nodo_id',NEW.tb_nodo_id,'tipo',NEW.tipo_componente,'nombre',NEW.nombre));
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS tr_auditar_sensor_nuevo ON tb_sensor;
CREATE TRIGGER tr_auditar_sensor_nuevo AFTER INSERT ON tb_sensor FOR EACH ROW EXECUTE FUNCTION fn_auditar_sensor_nuevo();

CREATE OR REPLACE FUNCTION fn_auditar_actuador_nuevo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO tb_bitacora_auditoria(accion_realizada,fecha_hora,tb_proyecto_id,categoria,origen,entidad,entidad_id,detalle,valores_nuevos)
 VALUES('Actuador registrado',NOW(),NEW.tb_proyecto_id,'INFRAESTRUCTURA','USUARIO','tb_actuador',NEW.id,
   'Se agregó el actuador '||NEW.nombre,jsonb_build_object('tipo',NEW.tipo_actuador,'duracion_maxima',NEW.duracion_maxima_segundos));
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS tr_auditar_actuador_nuevo ON tb_actuador;
CREATE TRIGGER tr_auditar_actuador_nuevo AFTER INSERT ON tb_actuador FOR EACH ROW EXECUTE FUNCTION fn_auditar_actuador_nuevo();
