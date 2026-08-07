CREATE TABLE IF NOT EXISTS tb_historial_parametrizacion_cultivo (
    id SERIAL PRIMARY KEY,
    tb_proyecto_id INT NOT NULL REFERENCES tb_proyecto(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(40) NOT NULL,
    origen VARCHAR(30) NOT NULL,
    valores_anteriores JSONB,
    valores_nuevos JSONB NOT NULL,
    motivo VARCHAR(500),
    nivel_confianza DECIMAL(5,2),
    cod_usuario_registro INT REFERENCES tb_usuario(id),
    fecha_registra TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_historial_parametrizacion_proyecto
ON tb_historial_parametrizacion_cultivo (tb_proyecto_id, fecha_registra DESC);

-- Crea la carga inicial para proyectos configurados antes de incorporar el historial.
INSERT INTO tb_historial_parametrizacion_cultivo (
    tb_proyecto_id,tipo_evento,origen,valores_nuevos,motivo,cod_usuario_registro,fecha_registra
)
SELECT pc.tb_proyecto_id,'Carga inicial',
       CASE WHEN pc.cod_usuario_registro IS NULL THEN 'Sistema' ELSE 'Usuario' END,
       jsonb_build_object(
           'cultivo_id',pc.tb_cultivo_id,'variedad',pc.variedad,'fecha_siembra',pc.fecha_siembra,
           'tiempo_cosecha_dias',pc.tiempo_cosecha_dias,
           'humedad_minima',pc.humedad_suelo_minima,'humedad_maxima',pc.humedad_suelo_maxima,
           'temperatura_minima',pc.temperatura_minima,'temperatura_maxima',pc.temperatura_maxima
       ),'Configuración inicial del proyecto',pc.cod_usuario_registro,pc.fecha_registra
FROM tb_proyecto_cultivo pc
WHERE NOT EXISTS (
    SELECT 1 FROM tb_historial_parametrizacion_cultivo h WHERE h.tb_proyecto_id=pc.tb_proyecto_id
);
