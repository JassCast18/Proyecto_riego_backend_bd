-- Migración incremental: no elimina tablas ni registros existentes.
INSERT INTO tb_submodulo (tb_modulo_id,codigo_submodulo,nombre_submodulo,descripcion,ruta,orden)
SELECT m.id,v.codigo,v.nombre,v.descripcion,v.ruta,v.orden
FROM (VALUES
 ('soporte_ayuda','Centro de ayuda','Preguntas frecuentes y soluciones','/dashboard/soporte/ayuda',1),
 ('soporte_nuevo','Nuevo ticket','Registro de solicitudes de soporte','/dashboard/soporte/nuevo',2),
 ('soporte_tickets','Mis solicitudes','Seguimiento de solicitudes propias','/dashboard/soporte/mis-tickets',3),
 ('soporte_bandeja','Bandeja de soporte','Gestión de solicitudes por el propietario','/dashboard/soporte/bandeja',4)
) v(codigo,nombre,descripcion,ruta,orden)
JOIN tb_modulo m ON m.codigo_modulo='soporte'
ON CONFLICT(codigo_submodulo) DO UPDATE SET
 tb_modulo_id=EXCLUDED.tb_modulo_id,nombre_submodulo=EXCLUDED.nombre_submodulo,
 descripcion=EXCLUDED.descripcion,ruta=EXCLUDED.ruta,orden=EXCLUDED.orden,sn_activo=TRUE;

INSERT INTO tb_permiso(codigo_permiso,nombre_permiso,descripcion,tipo_permiso)
VALUES
 ('soporte_ayuda.view','Ver centro de ayuda','Consultar preguntas frecuentes','submodulo'),
 ('soporte_nuevo.view','Crear tickets','Registrar solicitudes de soporte','submodulo'),
 ('soporte_tickets.view','Ver tickets propios','Consultar solicitudes propias','submodulo'),
 ('soporte_bandeja.view','Gestionar soporte','Gestionar todas las solicitudes de soporte','submodulo')
ON CONFLICT(codigo_permiso) DO UPDATE SET
 nombre_permiso=EXCLUDED.nombre_permiso,descripcion=EXCLUDED.descripcion,tipo_permiso=EXCLUDED.tipo_permiso,sn_activo=TRUE;

INSERT INTO tb_permiso_submodulo(tb_rol_id,tb_submodulo_id,tb_permiso_id)
SELECT r.id,s.id,p.id
FROM tb_rol r
JOIN tb_submodulo s ON s.codigo_submodulo IN('soporte_ayuda','soporte_nuevo','soporte_tickets','soporte_bandeja')
JOIN tb_permiso p ON p.codigo_permiso=s.codigo_submodulo||'.view'
WHERE r.id=1 OR (r.id IN(2,3) AND s.codigo_submodulo<>'soporte_bandeja')
ON CONFLICT(tb_rol_id,tb_submodulo_id,tb_permiso_id) DO UPDATE SET sn_activo=TRUE;
