# Configuracion de 8 nodos

## Flujo normal

- El gateway inicia un ciclo cada 15 minutos.
- Solicita la lectura de cada nodo habilitado con 3 segundos de separacion.
- Valida que la MAC y el ID recibido correspondan.
- Guarda hasta 32 lecturas en memoria y las envia a la API una por una.
- Durante pruebas o riego, el nodo toma lecturas cada 10 segundos.

## Registrar un nodo

1. Cargar temporalmente el perfil correspondiente en el ESP8266.
2. Leer su MAC en el monitor serial.
3. Registrar el mismo ID y MAC en Nodalvia.
4. Agregar la MAC en `Gateway_ESP32/include/device_config.h`.
5. Cambiar `enabled` de `false` a `true` para ese nodo.
6. Volver a cargar el firmware del gateway.

Ejemplo:

```cpp
{2, {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF}, true},
```

## Cargar cada ESP8266

Seleccionar el entorno `nodo_1`, `nodo_2`, ..., `nodo_8` en PlatformIO. Cada
entorno genera el mismo firmware con un `NODE_ID` diferente.

```powershell
pio run -e nodo_2 -t upload
```

## Cambiar a 20 minutos

En `Gateway_ESP32/include/device_config.h` cambiar:

```cpp
constexpr uint32_t TELEMETRY_INTERVAL_MS = 20UL * 60UL * 1000UL;
```

El gateway y todos los nodos deben usar el canal ESP-NOW 11. El archivo local
`Gateway_ESP32/include/secrets.h` no debe subirse a Git.
