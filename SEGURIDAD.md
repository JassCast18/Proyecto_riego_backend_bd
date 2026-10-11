# Seguridad de Nodalvia

## Resumen ejecutivo

Nodalvia aplica controles de seguridad en autenticacion, autorizacion por proyecto, comunicaciones, carga de archivos y auditoria. Estos controles reducen riesgos comunes, pero ningun sistema conectado a Internet debe describirse como invulnerable. La seguridad depende tambien de la configuracion de AWS, la rotacion de secretos, las actualizaciones y el monitoreo operativo.

## Controles implementados

### Identidad y contrasenas

- Las contrasenas se almacenan con `bcrypt` y factor de costo 10; nunca se guarda la contrasena original.
- La politica exige al menos 10 caracteres y un maximo de 72 bytes, ademas de mayuscula, minuscula, numero y simbolo; rechaza espacios y secuencias comunes.
- La API valida la politica aunque alguien evite las validaciones del navegador.
- El inicio de sesion entrega el mismo error cuando el usuario no existe o la contrasena es incorrecta, evitando revelar cuentas registradas.
- Los intentos de inicio de sesion se limitan a 10 por IP cada 15 minutos. La recuperacion se limita a 5 por IP cada 15 minutos.
- Los enlaces de recuperacion son temporales y la respuesta de solicitud no confirma si el correo existe.

### Sesiones y permisos

- Las rutas privadas exigen un JWT firmado y con expiracion configurable; el valor predeterminado es una hora.
- Los permisos se validan en el backend por rol, proyecto activo y pertenencia. Ocultar un boton en la interfaz no sustituye esta validacion.
- Las operaciones de usuario relevantes se registran en el modulo de auditoria.

### API, hardware y datos

- CORS solo permite los origenes configurados para el frontend.
- La API envia encabezados contra interpretacion de contenido, incrustacion en marcos y acceso innecesario a camara, microfono o ubicacion.
- Amplify recibe encabezados propios desde `customHttp.yml`, incluida una politica CSP que limita scripts, conexiones, marcos y recursos externos.
- El cuerpo JSON esta limitado a 100 KB y los adjuntos tienen controles de tipo, cantidad y tamano.
- Los nodos usan una API key; su comparacion se realiza en tiempo constante y la API rechaza el acceso si la clave del servidor no esta configurada.
- En produccion, CloudFront y el endpoint de la API deben usar HTTPS para cifrar credenciales, tokens y telemetria durante el transporte.

## Limites conocidos

- El limite de intentos vive en memoria. Si se ejecutan varias instancias o el proceso reinicia, debe sustituirse por AWS WAF, API Gateway o un almacen compartido como Redis.
- La API key de hardware es compartida. Para mayor aislamiento, cada nodo deberia tener credenciales propias y rotables; el nivel superior seria usar certificados por dispositivo con AWS IoT Core.
- No hay autenticacion multifactor. Es una mejora recomendada para propietarios y administradores.
- Los JWT almacenados en el navegador requieren prevenir XSS. Deben evitarse scripts de terceros innecesarios y mantenerse las dependencias actualizadas.
- La disponibilidad y recuperacion dependen de backups probados, alarmas y procedimientos de restauracion; tener una copia sin probarla no garantiza recuperacion.

## Operacion recomendada

1. Guardar `JWT_SECRET`, credenciales de base de datos, Brevo, Jira e `IOT_API_KEY` solo en secretos del entorno; nunca en Git.
2. Usar secretos largos y aleatorios y rotarlos ante cualquier exposicion.
3. Mantener HTTPS obligatorio y revisar CORS para que solo incluya los dominios reales.
4. Aplicar actualizaciones de dependencias y revisar vulnerabilidades antes de cada entrega.
5. Activar alarmas de errores, intentos rechazados y consumo en AWS.
6. Realizar backups y probar periodicamente una restauracion completa.

## Respuesta corta para una evaluacion

El sistema aplica defensa en profundidad: hash `bcrypt` para contrasenas, politica fuerte validada por cliente y servidor, JWT con expiracion, autorizacion por rol y proyecto, limitacion de intentos, CORS restringido, HTTPS en produccion, controles de archivos, API key para hardware y auditoria de acciones. No se considera invulnerable; los siguientes pasos para un entorno de mayor criticidad son MFA, rate limiting distribuido o AWS WAF y credenciales individuales por nodo.
