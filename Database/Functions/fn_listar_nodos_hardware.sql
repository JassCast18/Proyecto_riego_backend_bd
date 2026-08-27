DROP FUNCTION IF EXISTS fn_listar_nodos_hardware();
DROP FUNCTION IF EXISTS fn_listar_nodos_hardware(INTEGER);

CREATE OR REPLACE FUNCTION fn_listar_nodos_hardware(p_proyecto_id INTEGER DEFAULT NULL)
RETURNS TABLE(
    id INTEGER,
    tb_sector_id INTEGER,
    tipo_nodo VARCHAR,
    direccion_mac VARCHAR,
    estado_energia VARCHAR,
    usuario_cambio_energia VARCHAR,
    fecha_cambio_energia TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT n.id,n.tb_sector_id,n.tipo_nodo,n.direccion_mac,n.estado_energia,
           cambio.usuario_nombre,cambio.fecha_hora
    FROM tb_nodo_iot n
    INNER JOIN tb_sector s ON s.id = n.tb_sector_id
    INNER JOIN tb_finca f ON f.id = s.tb_finca_id
    LEFT JOIN LATERAL (
        SELECT concat_ws(' ',p.nombres,p.apellidos)::VARCHAR AS usuario_nombre,b.fecha_hora
        FROM tb_bitacora_auditoria b
        INNER JOIN tb_usuario u ON u.id=b.tb_usuario_id
        INNER JOIN tb_persona p ON p.id=u.tb_persona_id
        WHERE b.tb_proyecto_id=f.tb_proyecto_id
          AND b.entidad='tb_nodo_iot' AND b.entidad_id=n.id
          AND b.valores_nuevos->>'estado_energia'=n.estado_energia
        ORDER BY b.fecha_hora DESC,b.id DESC
        LIMIT 1
    ) cambio ON TRUE
    WHERE p_proyecto_id IS NULL OR f.tb_proyecto_id = p_proyecto_id
    ORDER BY n.id;
$$;
