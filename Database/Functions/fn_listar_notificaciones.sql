DROP FUNCTION IF EXISTS fn_listar_notificaciones(INT, INT, VARCHAR, INT);
DROP FUNCTION IF EXISTS fn_listar_notificaciones(INT, INT, INT, VARCHAR, INT);

CREATE OR REPLACE FUNCTION fn_listar_notificaciones(
    p_usuario_id INT,
    p_rol_id INT,
    p_proyecto_id INT,
    p_estado VARCHAR DEFAULT 'all',
    p_limite INT DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    tb_nodo_id INT,
    categoria VARCHAR,
    tipo VARCHAR,
    titulo VARCHAR,
    mensaje VARCHAR,
    severidad VARCHAR,
    estado VARCHAR,
    descartable BOOLEAN,
    fecha_creacion TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    revisada BOOLEAN
)
LANGUAGE sql
AS $$
    SELECT
        n.id,
        n.tb_nodo_id,
        n.categoria,
        n.tipo,
        n.titulo,
        n.mensaje,
        n.severidad,
        n.estado,
        n.descartable,
        n.fecha_creacion,
        n.fecha_actualizacion,
        n.fecha_resolucion,
        COALESCE(nu.revisada, FALSE) AS revisada
    FROM tb_notificacion n
    LEFT JOIN tb_notificacion_usuario nu
      ON nu.tb_notificacion_id = n.id
     AND nu.tb_usuario_id = p_usuario_id
    WHERE (n.tb_rol_id IS NULL OR n.tb_rol_id = p_rol_id)
      AND n.tb_proyecto_id = p_proyecto_id
      AND COALESCE(nu.descartada, FALSE) = FALSE
      AND (
          lower(COALESCE(p_estado, 'all')) = 'all'
          OR (lower(p_estado) = 'active' AND n.estado = 'ACTIVA')
          OR (lower(p_estado) = 'resolved' AND n.estado = 'RESUELTA')
          OR (lower(p_estado) = 'reviewed' AND COALESCE(nu.revisada, FALSE) = TRUE)
      )
    ORDER BY
        CASE WHEN n.estado = 'ACTIVA' THEN 0 ELSE 1 END,
        n.fecha_actualizacion DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limite, 50), 1), 100);
$$;
