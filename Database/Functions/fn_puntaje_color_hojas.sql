CREATE OR REPLACE FUNCTION fn_puntaje_color_hojas(p_color VARCHAR)
RETURNS DECIMAL
LANGUAGE sql
IMMUTABLE
AS $$
 SELECT CASE
   WHEN p_color IS NULL OR btrim(p_color)='' THEN NULL
   WHEN upper(btrim(p_color)) LIKE '%VERDE OSCUR%' THEN 100
   WHEN upper(btrim(p_color)) LIKE '%VERDE CLAR%' THEN 70
   WHEN upper(btrim(p_color)) LIKE '%VERD%' THEN 85
   WHEN upper(btrim(p_color)) LIKE '%AMARILL%' THEN 45
   WHEN upper(btrim(p_color)) LIKE '%MARR%' OR upper(btrim(p_color)) LIKE '%CAF%' THEN 20
   WHEN upper(btrim(p_color)) LIKE '%SEC%' OR upper(btrim(p_color)) LIKE '%MARCHIT%' THEN 5
   ELSE NULL
 END::DECIMAL;
$$;
