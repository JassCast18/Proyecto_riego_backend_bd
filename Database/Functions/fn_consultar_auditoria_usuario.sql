CREATE OR REPLACE FUNCTION fn_consultar_auditoria_usuario(
  p_proyecto_id INT,p_usuario_solicita INT,p_pagina INT DEFAULT 1,p_tamano INT DEFAULT 10,
  p_busqueda VARCHAR DEFAULT NULL,p_categoria VARCHAR DEFAULT NULL,p_usuario_filtro INT DEFAULT NULL,
  p_desde DATE DEFAULT NULL,p_hasta DATE DEFAULT NULL,p_accion VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE v_pagina INT:=GREATEST(COALESCE(p_pagina,1),1);v_tamano INT:=LEAST(GREATEST(COALESCE(p_tamano,10),5),100);v_resultado JSONB;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM tb_usuario_rol WHERE tb_proyecto_id=p_proyecto_id AND tb_usuario_id=p_usuario_solicita AND sn_activo) THEN
   RAISE EXCEPTION 'No tienes acceso a este proyecto.';
 END IF;
 WITH base AS (
   SELECT b.id,b.accion_realizada,b.fecha_hora,b.categoria,b.entidad,b.entidad_id,b.detalle,
     b.valores_anteriores,b.valores_nuevos,b.tb_usuario_id,
     COALESCE(NULLIF(trim(concat_ws(' ',p.nombres,p.apellidos)),''),u.username,u.correo_electronico,'Usuario #'||b.tb_usuario_id) usuario,
     u.username,u.correo_electronico
   FROM tb_bitacora_auditoria b
   JOIN tb_usuario u ON u.id=b.tb_usuario_id
   LEFT JOIN tb_persona p ON p.id=u.tb_persona_id
   WHERE b.tb_proyecto_id=p_proyecto_id AND b.origen='USUARIO' AND b.tb_usuario_id IS NOT NULL
 ), filtrado AS (
   SELECT * FROM base x WHERE
     (NULLIF(trim(COALESCE(p_busqueda,'')),'') IS NULL OR concat_ws(' ',x.accion_realizada,x.detalle,x.entidad,x.usuario,x.username,x.correo_electronico) ILIKE '%'||trim(p_busqueda)||'%')
     AND (NULLIF(trim(COALESCE(p_categoria,'')),'') IS NULL OR x.categoria=upper(trim(p_categoria)))
     AND (p_usuario_filtro IS NULL OR x.tb_usuario_id=p_usuario_filtro)
     AND (p_desde IS NULL OR x.fecha_hora>=p_desde)
     AND (p_hasta IS NULL OR x.fecha_hora<p_hasta+1)
     AND (NULLIF(trim(COALESCE(p_accion,'')),'') IS NULL OR x.accion_realizada=trim(p_accion))
 ), pagina AS (
   SELECT * FROM filtrado ORDER BY fecha_hora DESC,id DESC OFFSET (v_pagina-1)*v_tamano LIMIT v_tamano
 )
 SELECT jsonb_build_object(
   'registros',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.fecha_hora DESC,x.id DESC) FROM pagina x),'[]'::jsonb),
   'paginacion',jsonb_build_object('pagina',v_pagina,'tamano',v_tamano,'total',(SELECT COUNT(*) FROM filtrado),'paginas',GREATEST(1,CEIL((SELECT COUNT(*) FROM filtrado)::NUMERIC/v_tamano)::INT)),
   'resumen',jsonb_build_object('total',(SELECT COUNT(*) FROM base),'hoy',(SELECT COUNT(*) FROM base WHERE fecha_hora>=CURRENT_DATE),'usuarios',(SELECT COUNT(DISTINCT tb_usuario_id) FROM base),'categorias',(SELECT COUNT(DISTINCT categoria) FROM base)),
   'filtros',jsonb_build_object(
     'categorias',COALESCE((SELECT jsonb_agg(categoria ORDER BY categoria) FROM (SELECT DISTINCT categoria FROM base)c),'[]'::jsonb),
     'acciones',COALESCE((SELECT jsonb_agg(accion_realizada ORDER BY accion_realizada) FROM (SELECT DISTINCT accion_realizada FROM base)a),'[]'::jsonb),
     'usuarios',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',tb_usuario_id,'nombre',usuario) ORDER BY usuario) FROM (SELECT DISTINCT tb_usuario_id,usuario FROM base)u),'[]'::jsonb)
   )
 ) INTO v_resultado;
 RETURN v_resultado;
END; $$;
