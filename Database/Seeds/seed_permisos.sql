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
    ('auditoria', 'Auditoría', 'Bitácora de acciones', 'ClipboardList', '#', 8),
    ('usuarios', 'Usuarios', 'Gestión de usuarios', 'Users', '/dashboard/usuarios', 9),
    ('datos_maestros', 'Datos maestros', 'Módulo de catálogos maestros', 'Database', '/dashboard/maestros/finca', 10),
    ('soporte', 'Soporte', 'Ayuda y soporte', 'LifeBuoy', '#', 11)
ON CONFLICT (codigo_modulo) DO NOTHING;

INSERT INTO tb_submodulo (tb_modulo_id, codigo_submodulo, nombre_submodulo, descripcion, ruta, orden)
SELECT m.id, v.codigo_submodulo, v.nombre_submodulo, v.descripcion, v.ruta, v.orden
FROM (VALUES
    ('datos_maestros', 'finca', 'Finca', 'Gestión de fincas', '/dashboard/maestros/finca', 1),
    ('datos_maestros', 'sector', 'Sector', 'Gestión de sectores', '/dashboard/maestros/sector', 2),
    ('datos_maestros', 'cliente', 'Cliente', 'Gestión de clientes', '/dashboard/maestros/cliente', 3),
    ('datos_maestros', 'roles', 'Roles', 'Gestión de roles', '/dashboard/maestros/roles', 4),
    ('datos_maestros', 'nodos', 'Nodos', 'Gestión de nodos IoT', '/dashboard/maestros/nodos', 5),
    ('datos_maestros', 'sensores', 'Sensores', 'Gestión de sensores y actuadores', '/dashboard/maestros/sensores', 6)
) AS v(codigo_modulo, codigo_submodulo, nombre_submodulo, descripcion, ruta, orden)
INNER JOIN tb_modulo m
    ON m.codigo_modulo = v.codigo_modulo
ON CONFLICT (codigo_submodulo) DO NOTHING;

INSERT INTO tb_permiso (codigo_permiso, nombre_permiso, descripcion, tipo_permiso)
VALUES
    ('dashboard.view', 'Ver resumen', 'Acceso al dashboard principal', 'modulo'),
    ('alertas.view', 'Ver alertas', 'Acceso a alertas y notificaciones', 'modulo'),
    ('cultivo.view', 'Ver cultivo', 'Acceso a la configuración de cultivo', 'modulo'),
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
    ('sensores.view', 'Ver sensores', 'Acceso al catálogo de sensores', 'submodulo')
ON CONFLICT (codigo_permiso) DO NOTHING;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 1, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = 'dashboard.view'
WHERE m.codigo_modulo = 'dashboard'
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

INSERT INTO tb_permiso_submodulo (tb_rol_id, tb_submodulo_id, tb_permiso_id)
SELECT 1, s.id, p.id
FROM tb_submodulo s
INNER JOIN tb_permiso p ON p.codigo_permiso = s.codigo_submodulo || '.view'
ON CONFLICT DO NOTHING;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 2, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = m.codigo_modulo || '.view'
WHERE m.codigo_modulo IN ('dashboard', 'alertas', 'cultivo', 'reportes', 'auditoria', 'usuarios', 'datos_maestros', 'soporte')
ON CONFLICT DO NOTHING;

INSERT INTO tb_permiso_submodulo (tb_rol_id, tb_submodulo_id, tb_permiso_id)
SELECT 2, s.id, p.id
FROM tb_submodulo s
INNER JOIN tb_permiso p ON p.codigo_permiso = s.codigo_submodulo || '.view'
WHERE s.codigo_submodulo IN ('finca', 'sector', 'cliente', 'nodos', 'sensores')
ON CONFLICT DO NOTHING;

INSERT INTO tb_permiso_modulo (tb_rol_id, tb_modulo_id, tb_permiso_id)
SELECT 3, m.id, p.id
FROM tb_modulo m
INNER JOIN tb_permiso p ON p.codigo_permiso = m.codigo_modulo || '.view'
WHERE m.codigo_modulo IN ('dashboard', 'alertas', 'hardware', 'control_manual', 'soporte')
ON CONFLICT DO NOTHING;