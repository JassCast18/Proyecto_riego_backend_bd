INSERT INTO tb_rol (id, nombre_rol)
VALUES
    (1, 'Administrador'),
    (2, 'Supervisor'),
    (3, 'Operador')
ON CONFLICT (id) DO UPDATE
SET nombre_rol = EXCLUDED.nombre_rol;

INSERT INTO tb_modulo (codigo_modulo, nombre_modulo, descripcion, icono, ruta, orden)
VALUES
    ('dashboard', 'Resumen', 'Acceso al panel principal', 'LayoutDashboard', '/dashboard', 1),
    ('alertas', 'Alertas', 'Alertas y notificaciones del sistema', 'Bell', '#', 2),
    ('cultivo', 'Cultivo', 'Configuración del cultivo', 'Sprout', '#', 3),
    ('hardware', 'Hardware', 'Estado de hardware', 'Cpu', '#', 4),
    ('control_manual', 'Control manual', 'Acciones manuales sobre el riego', 'SlidersHorizontal', '#', 5),
    ('ia', 'IA', 'Reentrenamiento y modelos', 'BrainCircuit', '#', 6),
    ('reportes', 'Reportes', 'Historial y reportes', 'FileBarChart', '#', 7),
    ('auditoria', 'Auditoría', 'Bitácora de acciones', 'ClipboardList', '/dashboard/auditoria/busqueda', 8),
    ('usuarios', 'Usuarios', 'Gestión de usuarios', 'Users', '/dashboard/usuarios', 9),
    ('datos_maestros', 'Datos maestros', 'Módulo de catálogos maestros', 'Database', '/dashboard/maestros/finca', 10),
    ('soporte', 'Soporte', 'Ayuda y soporte', 'LifeBuoy', '#', 11)
ON CONFLICT (codigo_modulo) DO UPDATE SET
    nombre_modulo=EXCLUDED.nombre_modulo,descripcion=EXCLUDED.descripcion,ruta=EXCLUDED.ruta,
    orden=EXCLUDED.orden,sn_activo=TRUE;

INSERT INTO tb_submodulo (tb_modulo_id, codigo_submodulo, nombre_submodulo, descripcion, ruta, orden)
SELECT m.id, v.codigo_submodulo, v.nombre_submodulo, v.descripcion, v.ruta, v.orden
FROM (VALUES
    ('datos_maestros', 'finca', 'Finca', 'Gestión de fincas', '/dashboard/maestros/finca', 1),
    ('datos_maestros', 'sector', 'Sector', 'Gestión de sectores', '/dashboard/maestros/sector', 2),
    ('datos_maestros', 'cliente', 'Cliente', 'Gestión de clientes', '/dashboard/maestros/cliente', 3),
    ('datos_maestros', 'roles', 'Roles', 'Gestión de roles', '/dashboard/maestros/roles', 4),
    ('datos_maestros', 'nodos', 'Nodos', 'Gestión de nodos IoT', '/dashboard/maestros/nodos', 5),
    ('datos_maestros', 'sensores', 'Sensores', 'Gestión de sensores', '/dashboard/maestros/sensores', 6),
    ('datos_maestros', 'actuadores', 'Actuadores', 'Gestión de actuadores y sus nodos controladores', '/dashboard/maestros/actuadores', 7),
    ('datos_maestros', 'modulos_catalogo', 'Módulos', 'Gestión del catálogo de módulos', '/dashboard/maestros/modulos', 8),
    ('datos_maestros', 'submodulos_catalogo', 'Submódulos', 'Gestión del catálogo de submódulos', '/dashboard/maestros/submodulos', 9),
    ('control_manual', 'pruebas_unitarias', 'Pruebas unitarias', 'Pruebas rápidas y aisladas de sensores', '/dashboard/control-manual/pruebas', 1),
    ('control_manual', 'gestion_valvulas', 'Gestión de válvulas', 'Pruebas manuales seguras de actuadores', '/dashboard/control-manual/valvulas', 2),
    ('reportes', 'informes', 'Generación de informes', 'Registro manual de observaciones del cultivo', '/dashboard/reportes/informes', 1),
    ('reportes', 'historial_operativo', 'Historial operativo', 'Decisiones y cambios realizados en el proyecto', '/dashboard/reportes/historial', 2),
    ('reportes', 'comparacion_ciclos', 'Comparación de plantaciones', 'Comparación entre ciclos de cultivo', '/dashboard/reportes/comparacion', 3),
    ('reportes', 'listado_informes', 'Listado de informes', 'Consulta y búsqueda del historial completo de informes', '/dashboard/reportes/listado-informes', 4),
    ('reportes', 'exportar_reportes', 'Reportes', 'Exportación de datos del proyecto', '/dashboard/reportes/exportar', 5),
    ('auditoria', 'auditoria_busqueda', 'Búsqueda', 'Consulta filtrada de acciones realizadas por usuarios', '/dashboard/auditoria/busqueda', 1),
    ('auditoria', 'auditoria_historial', 'Histórico de acciones', 'Línea temporal de acciones realizadas por usuarios', '/dashboard/auditoria/historial', 2),
    ('soporte', 'soporte_ayuda', 'Centro de ayuda', 'Preguntas frecuentes y soluciones', '/dashboard/soporte/ayuda', 1),
    ('soporte', 'soporte_nuevo', 'Nuevo ticket', 'Registro de solicitudes de soporte', '/dashboard/soporte/nuevo', 2),
    ('soporte', 'soporte_tickets', 'Mis solicitudes', 'Seguimiento de solicitudes propias', '/dashboard/soporte/mis-tickets', 3)
) AS v(codigo_modulo, codigo_submodulo, nombre_submodulo, descripcion, ruta, orden)
INNER JOIN tb_modulo m
    ON m.codigo_modulo = v.codigo_modulo
ON CONFLICT (codigo_submodulo) DO UPDATE SET
    tb_modulo_id=EXCLUDED.tb_modulo_id,nombre_submodulo=EXCLUDED.nombre_submodulo,
    descripcion=EXCLUDED.descripcion,ruta=EXCLUDED.ruta,orden=EXCLUDED.orden,sn_activo=TRUE;

INSERT INTO tb_permiso (codigo_permiso, nombre_permiso, descripcion, tipo_permiso)
VALUES
    ('dashboard.view', 'Ver resumen', 'Acceso al dashboard principal', 'modulo'),
    ('alertas.view', 'Ver alertas', 'Acceso a alertas y notificaciones', 'modulo'),
    ('cultivo.view', 'Ver cultivo', 'Acceso a la parametrización de cultivo', 'modulo'),
    ('hardware.view', 'Ver hardware', 'Acceso al estado de hardware', 'modulo'),
    ('control_manual.view', 'Ver control manual', 'Acceso al control manual', 'modulo'),
    ('ia.view', 'Ver IA', 'Acceso al módulo de IA', 'modulo'),
    ('reportes.view', 'Ver reportes', 'Acceso a reportes e historial', 'modulo'),
    ('auditoria.view', 'Ver auditoría', 'Acceso a la bitácora de acciones', 'modulo'),
    ('usuarios.view', 'Ver usuarios', 'Acceso a la gestión de usuarios', 'modulo'),
    ('datos_maestros.view', 'Ver datos maestros', 'Acceso al módulo de catálogos maestros', 'modulo'),
    ('soporte.view', 'Ver soporte', 'Acceso al módulo de soporte', 'modulo'),
    ('finca.view', 'Ver fincas', 'Acceso al catálogo de fincas', 'submodulo'),
    ('sector.view', 'Ver sectores', 'Acceso al catálogo de sectores', 'submodulo'),
    ('cliente.view', 'Ver clientes', 'Acceso al catálogo de clientes', 'submodulo'),
    ('roles.view', 'Ver roles', 'Acceso al catálogo de roles', 'submodulo'),
    ('nodos.view', 'Ver nodos', 'Acceso al catálogo de nodos', 'submodulo'),
    ('sensores.view', 'Ver sensores', 'Acceso al catálogo de sensores', 'submodulo'),
    ('actuadores.view', 'Ver actuadores', 'Acceso al catálogo de actuadores', 'submodulo'),
    ('modulos_catalogo.view', 'Ver módulos', 'Acceso al catálogo de módulos', 'submodulo'),
    ('submodulos_catalogo.view', 'Ver submódulos', 'Acceso al catálogo de submódulos', 'submodulo'),
    ('pruebas_unitarias.view', 'Ver pruebas unitarias', 'Ejecutar pruebas de sensores', 'submodulo'),
    ('gestion_valvulas.view', 'Gestionar válvulas', 'Ejecutar pruebas seguras de actuadores', 'submodulo'),
    ('informes.view', 'Ver informes', 'Acceso a informes manuales de campo', 'submodulo'),
    ('historial_operativo.view', 'Ver historial operativo', 'Acceso a decisiones y cambios del proyecto', 'submodulo'),
    ('comparacion_ciclos.view', 'Ver comparación de ciclos', 'Acceso a comparación entre plantaciones', 'submodulo'),
    ('listado_informes.view', 'Ver listado de informes', 'Acceso al historial completo de informes', 'submodulo'),
    ('exportar_reportes.view', 'Exportar reportes', 'Acceso a filtros y exportación de reportes', 'submodulo'),
    ('auditoria_busqueda.view', 'Buscar auditoría', 'Acceso a filtros de auditoría', 'submodulo'),
    ('auditoria_historial.view', 'Ver histórico de auditoría', 'Acceso al histórico de acciones', 'submodulo'),
    ('soporte_ayuda.view', 'Ver centro de ayuda', 'Consultar preguntas frecuentes', 'submodulo'),
    ('soporte_nuevo.view', 'Crear tickets', 'Registrar solicitudes de soporte', 'submodulo'),
    ('soporte_tickets.view', 'Ver tickets propios', 'Consultar solicitudes propias', 'submodulo')
ON CONFLICT (codigo_permiso) DO UPDATE SET
    nombre_permiso=EXCLUDED.nombre_permiso,descripcion=EXCLUDED.descripcion,
    tipo_permiso=EXCLUDED.tipo_permiso,sn_activo=TRUE;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 1, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = 'dashboard.view'
WHERE m.codigo_modulo = 'dashboard'
ON CONFLICT (tb_rol_id, tb_modulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_submodulo(tb_rol_id,tb_submodulo_id,tb_permiso_id)
SELECT 3,s.id,p.id FROM tb_submodulo s JOIN tb_permiso p ON p.codigo_permiso=s.codigo_submodulo||'.view'
WHERE s.codigo_submodulo IN('pruebas_unitarias','gestion_valvulas')
ON CONFLICT(tb_rol_id,tb_submodulo_id,tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 1, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = m.codigo_modulo || '.view'
WHERE m.codigo_modulo IN (
    'alertas',
    'cultivo',
    'hardware',
    'control_manual',
    'ia',
    'reportes',
    'auditoria',
    'usuarios',
    'datos_maestros',
    'soporte'
)
ON CONFLICT (tb_rol_id, tb_modulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_submodulo (tb_rol_id, tb_submodulo_id, tb_permiso_id)
SELECT 1, s.id, p.id
FROM tb_submodulo s
INNER JOIN tb_permiso p ON p.codigo_permiso = s.codigo_submodulo || '.view'
ON CONFLICT (tb_rol_id, tb_submodulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 2, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = m.codigo_modulo || '.view'
WHERE m.codigo_modulo IN ('dashboard', 'alertas', 'cultivo', 'hardware', 'reportes', 'auditoria', 'soporte')
ON CONFLICT (tb_rol_id, tb_modulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_submodulo (tb_rol_id, tb_submodulo_id, tb_permiso_id)
SELECT 2, s.id, p.id
FROM tb_submodulo s
INNER JOIN tb_permiso p ON p.codigo_permiso = s.codigo_submodulo || '.view'
WHERE s.codigo_submodulo IN ('finca', 'sector', 'cliente', 'nodos', 'sensores')
ON CONFLICT (tb_rol_id, tb_submodulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 3, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = m.codigo_modulo || '.view'
WHERE m.codigo_modulo IN ('dashboard', 'alertas', 'hardware', 'control_manual', 'soporte')
ON CONFLICT (tb_rol_id, tb_modulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

-- Supervisor conserva reportes, pero no administra catálogos maestros.
DELETE FROM tb_permiso_submodulo ps
USING tb_submodulo s
WHERE ps.tb_submodulo_id=s.id AND ps.tb_rol_id=2
  AND s.codigo_submodulo IN ('finca','sector','cliente','roles','nodos','sensores');

INSERT INTO tb_permiso_submodulo (tb_rol_id,tb_submodulo_id,tb_permiso_id)
SELECT 2,s.id,p.id FROM tb_submodulo s
JOIN tb_permiso p ON p.codigo_permiso=s.codigo_submodulo||'.view'
WHERE s.codigo_submodulo IN ('informes','historial_operativo','comparacion_ciclos','listado_informes','exportar_reportes')
ON CONFLICT (tb_rol_id, tb_submodulo_id, tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_submodulo (tb_rol_id,tb_submodulo_id,tb_permiso_id)
SELECT 2,s.id,p.id FROM tb_submodulo s
JOIN tb_permiso p ON p.codigo_permiso=s.codigo_submodulo||'.view'
WHERE s.codigo_submodulo IN ('auditoria_busqueda','auditoria_historial')
ON CONFLICT(tb_rol_id,tb_submodulo_id,tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

INSERT INTO tb_permiso_submodulo (tb_rol_id,tb_submodulo_id,tb_permiso_id)
SELECT r.id,s.id,p.id
FROM tb_rol r
JOIN tb_submodulo s ON s.codigo_submodulo IN ('soporte_ayuda','soporte_nuevo','soporte_tickets')
JOIN tb_permiso p ON p.codigo_permiso=s.codigo_submodulo||'.view'
WHERE r.id IN (2,3)
ON CONFLICT(tb_rol_id,tb_submodulo_id,tb_permiso_id) DO UPDATE SET sn_activo=TRUE;

DELETE FROM tb_permiso_modulo pm
USING tb_modulo m
WHERE pm.tb_modulo_id = m.id
  AND pm.tb_rol_id = 2
  AND m.codigo_modulo IN ('usuarios', 'datos_maestros');
