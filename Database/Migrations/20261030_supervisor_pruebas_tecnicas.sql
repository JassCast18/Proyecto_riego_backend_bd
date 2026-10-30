-- Permite que el Supervisor ejecute pruebas técnicas de sensores sin habilitar
-- la gestión manual de válvulas ni otros permisos administrativos.
BEGIN;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 2, m.id, p.id
FROM tb_modulo m
JOIN tb_permiso p ON p.codigo_permiso = 'control_manual.view'
WHERE m.codigo_modulo = 'control_manual'
ON CONFLICT (tb_rol_id, tb_modulo_id, tb_permiso_id)
DO UPDATE SET sn_activo = TRUE;

INSERT INTO tb_permiso_submodulo (tb_rol_id, tb_submodulo_id, tb_permiso_id)
SELECT 2, s.id, p.id
FROM tb_submodulo s
JOIN tb_permiso p ON p.codigo_permiso = 'pruebas_unitarias.view'
WHERE s.codigo_submodulo = 'pruebas_unitarias'
ON CONFLICT (tb_rol_id, tb_submodulo_id, tb_permiso_id)
DO UPDATE SET sn_activo = TRUE;

COMMIT;
