\i Tables/tb_persona.sql
\i Tables/tb_rol.sql
\i Tables/tb_modulo.sql
\i Tables/tb_submodulo.sql
\i Tables/tb_permiso.sql
\i Tables/tb_permiso_modulo.sql
\i Tables/tb_permiso_submodulo.sql
\i Tables/tb_usuario.sql
\i Tables/tb_proyecto.sql
\i Tables/tb_usuario_rol.sql
\i Tables/tb_cultivo.sql
\i Tables/tb_proyecto_cultivo.sql
\i Tables/tb_ciclo_cultivo.sql
\i Tables/tb_historial_parametrizacion_cultivo.sql
\i Tables/tb_cliente.sql
\i Tables/tb_finca.sql
\i Tables/tb_usuario_finca.sql
\i Tables/tb_sector.sql
\i Tables/tb_configuracion_cultivo.sql
\i Tables/tb_nodo_iot.sql
\i Tables/tb_sensor.sql
\i Tables/tb_actuador.sql
\i Tables/tb_telemetria.sql
\i Tables/tb_ticket_soporte.sql
\i Tables/tb_bitacora_auditoria.sql
\i Tables/tb_alerta_hidrica.sql
\i Tables/tb_notificacion.sql
\i Tables/tb_ciclo_riego.sql
\i Tables/tb_recuperacion_password.sql
\i Tables/tb_informe_supervision.sql
\i Tables/tb_datos_fenologicos.sql
\i Tables/tb_informe_adjunto.sql
\i Tables/tb_prueba_unitaria.sql
\i Tables/tb_calibracion_sensor.sql
\i Tables/tb_version_modelo_ia.sql
\i Tables/tb_configuracion_ia.sql
\i Functions/fn_listar_usuarios.sql
\i Functions/fn_listar_roles.sql
\i Functions/fn_listar_nodos_hardware.sql
\i Functions/fn_listar_catalogo_control_manual.sql
\i Functions/fn_sincronizar_pruebas_actuador.sql
\i Functions/fn_listar_pruebas_control_manual.sql
\i Functions/fn_obtener_prueba_control_manual.sql
\i Functions/fn_tomar_comandos_iot.sql
\i Functions/fn_obtener_nombre_usuario.sql
\i Functions/fn_listar_telemetria_hardware.sql
\i Functions/fn_evaluar_estado_nodo.sql
\i Functions/fn_listar_permisos_rol.sql
\i Functions/fn_obtener_accesos_rol.sql
\i Functions/fn_listar_catalogo_abm.sql
\i Functions/fn_listar_notificaciones.sql
\i Functions/fn_resumen_notificaciones.sql
\i Functions/fn_listar_revisores_notificaciones.sql
\i Functions/fn_marcar_notificacion_revisada.sql
\i Functions/fn_descartar_notificacion.sql
\i Functions/fn_reconocer_incidente.sql
\i Functions/fn_obtener_reglas_cultivo_alertas.sql
\i Functions/fn_listar_proyectos_monitoreo.sql
\i Functions/fn_listar_alertas_email_pendientes.sql
\i Functions/fn_buscar_usuario_recuperacion.sql
\i Functions/fn_validar_token_recuperacion.sql
\i Functions/fn_listar_proyectos_usuario.sql
\i Functions/fn_listar_cultivos.sql
\i Functions/fn_obtener_parametrizacion_cultivo.sql
\i Functions/fn_listar_historial_parametrizacion.sql
\i Functions/fn_listar_informes_campo.sql
\i Functions/fn_obtener_adjunto_informe.sql
\i Functions/fn_listar_administradores_proyecto.sql
\i Functions/fn_listar_historial_operativo.sql
\i Functions/fn_consultar_auditoria_usuario.sql
\i Functions/fn_listar_comparacion_ciclos.sql
\i Functions/fn_validar_acceso_proyecto.sql
\i Functions/fn_es_propietario.sql
\i Functions/fn_auditar_componentes_nuevos.sql
\i Functions/fn_puntaje_color_hojas.sql
\i Functions/fn_obtener_resumen_foliar_ia.sql
\i Functions/fn_obtener_dataset_ia.sql
\i Functions/fn_obtener_dataset_ia_corte.sql
\i Functions/fn_obtener_contextos_ia.sql
\i Functions/fn_listar_actuadores_ia.sql
\i Functions/fn_obtener_estado_ia.sql
\i Functions/fn_obtener_reentrenamiento_ia.sql
\i Functions/fn_obtener_feedback_ia.sql
\i Functions/fn_obtener_feedback_ia_corte.sql
\i Functions/fn_obtener_configuracion_ia.sql
\i Functions/fn_listar_proyectos_ia_automatica.sql
\i Stored Procedure/sp_actualizar_usuario.sql
\i Stored Procedure/sp_actualizar_password_usuario.sql
\i Stored Procedure/sp_actualizar_estado_usuario.sql
\i Stored Procedure/sp_actualizar_estado_energia_nodo.sql
\i Stored Procedure/sp_sincronizar_ciclos_riego.sql
\i Stored Procedure/sp_evaluar_riego_automatico.sql
\i Stored Procedure/sp_guardar_telemetria_nodo.sql
\i Stored Procedure/sp_iniciar_prueba_control_manual.sql
\i Stored Procedure/sp_registrar_actuador.sql
\i Stored Procedure/sp_finalizar_prueba_control_manual.sql
\i Stored Procedure/sp_completar_reparacion_sensor.sql
\i Stored Procedure/sp_confirmar_comando_iot.sql
\i Stored Procedure/sp_registrar_lecturas_prueba.sql
\i Stored Procedure/sp_registrar_calibracion_sensor.sql
\i Stored Procedure/sp_evaluar_estado_nodo.sql
\i Stored Procedure/sp_registro_usuario.sql
\i Stored Procedure/sp_abm_catalogo.sql
\i Stored Procedure/sp_abm_cliente.sql
\i Stored Procedure/sp_sincronizar_notificaciones_hardware.sql
\i Stored Procedure/sp_registrar_entrega_alerta.sql
\i Stored Procedure/sp_crear_token_recuperacion.sql
\i Stored Procedure/sp_restablecer_password.sql
\i Stored Procedure/sp_crear_proyecto.sql
\i Stored Procedure/sp_configurar_cultivo_proyecto.sql
\i Stored Procedure/sp_crear_infraestructura_proyecto.sql
\i Stored Procedure/sp_asignar_usuario_proyecto.sql
\i Stored Procedure/sp_asignar_finca_proyecto.sql
\i Stored Procedure/sp_cambiar_estado_usuario_proyecto.sql
\i Stored Procedure/sp_actualizar_preferencia_alertas_correo.sql
\i Stored Procedure/sp_cambiar_estado_proyecto.sql
\i Stored Procedure/sp_guardar_rol_permisos.sql
\i Stored Procedure/sp_registrar_informe_campo.sql
\i Stored Procedure/sp_crear_notificacion_informe.sql
\i Stored Procedure/sp_registrar_adjuntos_informe.sql
\i Stored Procedure/sp_finalizar_ciclo_cultivo.sql
\i Stored Procedure/sp_iniciar_ciclo_cultivo.sql
\i Stored Procedure/sp_registrar_modelo_ia.sql
\i Stored Procedure/sp_restaurar_modelo_ia.sql
\i Stored Procedure/sp_registrar_decision_ia.sql
\i Stored Procedure/sp_resolver_decision_ia.sql
\i Stored Procedure/sp_configurar_ia.sql
\i Stored Procedure/sp_corregir_parametros_iniciales.sql
\i Functions/fn_login_usuario.sql
\i Seeds/seed_permisos.sql
