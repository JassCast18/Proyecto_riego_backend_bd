DROP FUNCTION IF EXISTS fn_obtener_reglas_cultivo_alertas(INT);

CREATE OR REPLACE FUNCTION fn_obtener_reglas_cultivo_alertas(p_proyecto_id INT)
RETURNS TABLE(
    cultivo VARCHAR,humedad_minima DECIMAL,humedad_maxima DECIMAL,
    temperatura_minima DECIMAL,temperatura_maxima DECIMAL
)
LANGUAGE sql
AS $$
    SELECT c.nombre,pc.humedad_suelo_minima,pc.humedad_suelo_maxima,
           pc.temperatura_minima,pc.temperatura_maxima
    FROM tb_proyecto_cultivo pc
    JOIN tb_cultivo c ON c.id=pc.tb_cultivo_id
    WHERE pc.tb_proyecto_id=p_proyecto_id;
$$;
