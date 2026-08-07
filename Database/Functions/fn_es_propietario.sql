CREATE OR REPLACE FUNCTION fn_es_propietario(p_usuario_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
AS $$
    SELECT EXISTS (SELECT 1 FROM tb_usuario WHERE id=p_usuario_id AND sn_activo=TRUE AND sn_propietario=-1);
$$;
