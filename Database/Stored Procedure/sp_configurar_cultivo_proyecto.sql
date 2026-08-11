CREATE OR REPLACE PROCEDURE sp_configurar_cultivo_proyecto(
    IN p_proyecto_id INTEGER,
    IN p_usuario_id INTEGER,
    IN p_cultivo_id INTEGER,
    IN p_variedad VARCHAR,
    IN p_fecha_siembra DATE,
    IN p_tiempo_cosecha_dias INTEGER,
    IN p_humedad_minima DECIMAL,
    IN p_humedad_maxima DECIMAL,
    IN p_temperatura_minima DECIMAL,
    IN p_temperatura_maxima DECIMAL,
    IN p_observaciones VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM tb_usuario_rol
        WHERE tb_proyecto_id = p_proyecto_id AND tb_usuario_id = p_usuario_id
          AND sn_activo = TRUE AND tb_rol_id = 1
    ) THEN
        RAISE EXCEPTION 'No tienes permiso para configurar este proyecto.';
    END IF;

    IF p_humedad_minima IS NOT NULL AND p_humedad_maxima IS NOT NULL
       AND p_humedad_minima > p_humedad_maxima THEN
        RAISE EXCEPTION 'La humedad mínima no puede superar la máxima.';
    END IF;

    IF p_temperatura_minima IS NOT NULL AND p_temperatura_maxima IS NOT NULL
       AND p_temperatura_minima > p_temperatura_maxima THEN
        RAISE EXCEPTION 'La temperatura mínima no puede superar la máxima.';
    END IF;

    INSERT INTO tb_proyecto_cultivo (
        tb_proyecto_id, tb_cultivo_id, variedad, fecha_siembra,
        tiempo_cosecha_dias, humedad_suelo_minima, humedad_suelo_maxima,
        temperatura_minima, temperatura_maxima, observaciones,
        cod_usuario_registro
    ) VALUES (
        p_proyecto_id, p_cultivo_id, NULLIF(trim(p_variedad), ''), p_fecha_siembra,
        p_tiempo_cosecha_dias, p_humedad_minima, p_humedad_maxima,
        p_temperatura_minima, p_temperatura_maxima, NULLIF(trim(p_observaciones), ''),
        p_usuario_id
    )
    ON CONFLICT (tb_proyecto_id) DO UPDATE SET
        tb_cultivo_id = EXCLUDED.tb_cultivo_id,
        variedad = EXCLUDED.variedad,
        fecha_siembra = EXCLUDED.fecha_siembra,
        tiempo_cosecha_dias = EXCLUDED.tiempo_cosecha_dias,
        humedad_suelo_minima = EXCLUDED.humedad_suelo_minima,
        humedad_suelo_maxima = EXCLUDED.humedad_suelo_maxima,
        temperatura_minima = EXCLUDED.temperatura_minima,
        temperatura_maxima = EXCLUDED.temperatura_maxima,
        observaciones = EXCLUDED.observaciones,
        cod_usuario_modifica = p_usuario_id,
        fecha_modifica = NOW();

    IF NOT EXISTS (SELECT 1 FROM tb_historial_parametrizacion_cultivo WHERE tb_proyecto_id=p_proyecto_id) THEN
        INSERT INTO tb_historial_parametrizacion_cultivo (
            tb_proyecto_id,tipo_evento,origen,valores_nuevos,motivo,cod_usuario_registro
        ) VALUES (
            p_proyecto_id,'Carga inicial','Usuario',
            jsonb_build_object(
                'cultivo_id',p_cultivo_id,'variedad',NULLIF(trim(p_variedad),''),'fecha_siembra',p_fecha_siembra,
                'tiempo_cosecha_dias',p_tiempo_cosecha_dias,
                'humedad_minima',p_humedad_minima,'humedad_maxima',p_humedad_maxima,
                'temperatura_minima',p_temperatura_minima,'temperatura_maxima',p_temperatura_maxima
            ),'Configuración inicial del proyecto',p_usuario_id
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tb_ciclo_cultivo WHERE tb_proyecto_id=p_proyecto_id) THEN
        INSERT INTO tb_ciclo_cultivo(
            tb_proyecto_id,numero_ciclo,tb_cultivo_id,variedad,fecha_inicio,
            tiempo_cosecha_estimado_dias,estado,cod_usuario_registro
        ) VALUES(
            p_proyecto_id,1,p_cultivo_id,NULLIF(trim(p_variedad),''),p_fecha_siembra,
            p_tiempo_cosecha_dias,'ACTIVO',p_usuario_id
        );
    END IF;
END;
$$;
