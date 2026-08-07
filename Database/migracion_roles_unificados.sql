-- Ejecutar una sola vez DESPUÉS de actualizar las funciones y procedimientos.
-- Conserva roles por proyecto y convierte propietarios anteriores a sn_propietario=-1.
BEGIN;

INSERT INTO tb_usuario_rol (
    tb_usuario_id,tb_rol_id,tb_proyecto_id,sn_activo,
    cod_usuario_registro,fecha_registra,cod_usuario_modifica,fecha_modifica
)
SELECT up.tb_usuario_id,up.tb_rol_id,up.tb_proyecto_id,up.sn_activo,
       up.cod_usuario_registro,up.fecha_registra,up.cod_usuario_modifica,up.fecha_modifica
FROM tb_usuario_proyecto up
ON CONFLICT (tb_usuario_id,tb_proyecto_id) DO UPDATE SET
    tb_rol_id=EXCLUDED.tb_rol_id,
    sn_activo=EXCLUDED.sn_activo,
    cod_usuario_modifica=EXCLUDED.cod_usuario_modifica,
    fecha_modifica=EXCLUDED.fecha_modifica;

UPDATE tb_usuario u
SET sn_propietario=-1
WHERE EXISTS (
    SELECT 1 FROM tb_usuario_proyecto up
    WHERE up.tb_usuario_id=u.id AND up.es_propietario=TRUE
)
OR EXISTS (
    SELECT 1
    FROM tb_usuario_rol_sistema urs
    INNER JOIN tb_rol_sistema rs ON rs.id=urs.tb_rol_sistema_id
    WHERE urs.tb_usuario_id=u.id AND urs.sn_activo=TRUE
      AND rs.codigo='PROPIETARIO'
);

DROP FUNCTION IF EXISTS fn_tiene_rol_sistema(INTEGER,VARCHAR);
DROP PROCEDURE IF EXISTS sp_asignar_rol_sistema(INTEGER,VARCHAR,INTEGER);
DROP TABLE IF EXISTS tb_usuario_rol_sistema;
DROP TABLE IF EXISTS tb_rol_sistema;
DROP TABLE IF EXISTS tb_usuario_proyecto;
ALTER TABLE tb_usuario DROP COLUMN IF EXISTS tb_rol_id;

COMMIT;
