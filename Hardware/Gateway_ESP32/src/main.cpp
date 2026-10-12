#include <Arduino.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <time.h>
#include <Wire.h>

#include "amazon_root_ca.h"
#include "device_config.h"
#include "secrets.h"

struct MensajeLectura {
  int id_nodo;
  int humedad_cruda;
  float temp_suelo;
  float bateria;
  uint32_t prueba_id;
};

struct MensajeComando {
  uint32_t comando_id;
  uint32_t prueba_id;
  uint32_t componente_id;
  uint8_t tipo;
  uint32_t intervalo_ms;
  uint32_t duracion_ms;
  uint8_t pin;
  bool activo_low;
};

struct LecturaGateway {
  float temperatura_ambiente;
  float humedad_relativa;
  float presion_atmosferica;
  uint32_t prueba_id;
};

struct ConfirmacionPendiente {
  uint32_t id;
  bool exitosa;
  char mensaje[80];
};

struct ComandoPendiente {
  MensajeComando comando;
  uint16_t nodoId;
  uint8_t mac[6];
  bool esGateway;
};

QueueHandle_t colaTelemetria = nullptr;
QueueHandle_t colaTelemetriaGateway = nullptr;
QueueHandle_t colaConfirmaciones = nullptr;
ComandoPendiente comandosPendientes[COMMAND_BUFFER_SIZE]{};
size_t cantidadComandosPendientes = 0;
bool espNowActivo = false;
bool relojSincronizado = false;
bool cicloMuestreoActivo = false;
size_t indiceTurno = 0;
unsigned long proximoTurno = 0;
unsigned long proximoCiclo = 5000;
unsigned long ultimaSincronizacion = 0;
uint32_t ultimoComandoEnviado = 0;
Preferences preferences;
Adafruit_BME280 bme;
bool bmeDisponible = false;
uint16_t gatewayNodeId = 0;
bool pruebaBmeActiva = false;
uint32_t pruebaBmeId = 0;
uint32_t intervaloBmePrueba = 10000UL;
unsigned long finPruebaBme = 0;
unsigned long proximaLecturaBme = 5000UL;

bool vencido(unsigned long ahora, unsigned long objetivo) {
  return static_cast<long>(ahora - objetivo) >= 0;
}

const NodeConfig* buscarNodoPorId(uint16_t id) {
  for (const auto& node : NODES) {
    if (node.enabled && node.id == id) return &node;
  }
  return nullptr;
}

const NodeConfig* buscarNodoPorMac(const uint8_t* mac) {
  for (const auto& node : NODES) {
    if (node.enabled && memcmp(node.mac, mac, 6) == 0) return &node;
  }
  return nullptr;
}

size_t contarNodosActivos() {
  size_t total = 0;
  for (const auto& node : NODES) total += node.enabled ? 1 : 0;
  return total;
}

bool configuracionValida() {
  const bool secretosIncompletos =
      strlen(WIFI_SSID) == 0 || strlen(IOT_API_KEY) == 0 ||
      strstr(IOT_API_KEY, "REPLACE_") != nullptr ||
      strstr(IOT_API_KEY, "YOUR_") != nullptr;
  if (secretosIncompletos) {
    Serial.println("[CONFIG] Completa include/secrets.h antes de cargar el gateway");
  }
  if (contarNodosActivos() == 0) {
    Serial.println("[CONFIG] Sin nodos remotos; solo se publicara el BME280");
  }
  if (GATEWAY_PROJECT_ID == 0) {
    Serial.println("[CONFIG] GATEWAY_PROJECT_ID debe identificar el proyecto activo");
    return false;
  }
  return !secretosIncompletos;
}

void onDataRecv(const uint8_t* mac, const uint8_t* data, int len) {
  if (len != sizeof(MensajeLectura)) {
    Serial.printf("[ESP-NOW] Paquete de %d bytes ignorado\n", len);
    return;
  }

  const NodeConfig* node = buscarNodoPorMac(mac);
  if (!node) {
    Serial.println("[SEGURIDAD] Lectura rechazada: MAC no registrada");
    return;
  }

  MensajeLectura lectura{};
  memcpy(&lectura, data, sizeof(lectura));
  if (lectura.id_nodo != node->id) {
    Serial.printf("[SEGURIDAD] MAC del nodo %u envio ID %d\n", node->id,
                  lectura.id_nodo);
    return;
  }

  if (xQueueSend(colaTelemetria, &lectura, 0) != pdTRUE) {
    Serial.printf("[COLA] Telemetria llena; lectura del nodo %u descartada\n",
                  node->id);
    return;
  }
  Serial.printf("[COLA] Nodo %u agregado; pendientes=%u\n", node->id,
                static_cast<unsigned>(uxQueueMessagesWaiting(colaTelemetria)));
}

void iniciarEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(ESPNOW_CHANNEL, WIFI_SECOND_CHAN_NONE);
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ESP-NOW] Error al iniciar");
    return;
  }
  esp_now_register_recv_cb(onDataRecv);
  espNowActivo = true;

  for (const auto& node : NODES) {
    if (!node.enabled) continue;
    esp_now_peer_info_t peer{};
    memcpy(peer.peer_addr, node.mac, 6);
    peer.channel = ESPNOW_CHANNEL;
    peer.encrypt = false;
    const esp_err_t result = esp_now_add_peer(&peer);
    Serial.printf("[ESP-NOW] Nodo %u registrado: %d\n", node.id, result);
  }
  Serial.printf("[ESP-NOW] Canal=%u, MAC gateway=%s\n", ESPNOW_CHANNEL,
                WiFi.macAddress().c_str());
}

void detenerEspNow() {
  if (!espNowActivo) return;
  esp_now_deinit();
  espNowActivo = false;
}

bool sincronizarReloj() {
  if (relojSincronizado && time(nullptr) > 1700000000) return true;
  configTime(0, 0, "pool.ntp.org", "time.cloudflare.com");
  const unsigned long inicio = millis();
  while (time(nullptr) < 1700000000 && millis() - inicio < 10000) delay(200);
  relojSincronizado = time(nullptr) > 1700000000;
  if (!relojSincronizado) Serial.println("[TLS] No fue posible obtener la hora");
  return relojSincronizado;
}

bool conectarWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const unsigned long inicio = millis();
  Serial.printf("[WiFi] Conectando a %s", WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 15000) {
    delay(250);
    Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf(" FALLO (%d)\n", WiFi.status());
    return false;
  }
  Serial.printf(" OK, IP=%s\n", WiFi.localIP().toString().c_str());
  return sincronizarReloj();
}

void restaurarEspNow() {
  WiFi.disconnect(true);
  delay(100);
  iniciarEspNow();
}

bool iniciarHttp(HTTPClient& http, WiFiClientSecure& client, const String& url) {
  client.setCACert(AMAZON_ROOT_CA_1);
  client.setTimeout(12000);
  if (!http.begin(client, url)) return false;
  http.setTimeout(12000);
  http.addHeader("x-api-key", IOT_API_KEY);
  return true;
}

bool publicarLectura(const MensajeLectura& lectura) {
  WiFiClientSecure client;
  HTTPClient http;
  if (!iniciarHttp(http, client, String(API_BASE) + "/telemetria/lecturas")) {
    return false;
  }
  JsonDocument doc;
  doc["id_nodo"] = lectura.id_nodo;
  doc["humedad_cruda"] = lectura.humedad_cruda;
  doc["temp_suelo"] = lectura.temp_suelo;
  doc["prueba_id"] = lectura.prueba_id;
  String body;
  serializeJson(doc, body);
  http.addHeader("Content-Type", "application/json");
  const int code = http.POST(body);
  Serial.printf("[HTTP] Telemetria nodo %d -> %d\n", lectura.id_nodo, code);
  if (code < 200 || code >= 300) Serial.println(http.getString());
  http.end();
  return code >= 200 && code < 300;
}

void vaciarColaTelemetria() {
  MensajeLectura lectura{};
  while (xQueuePeek(colaTelemetria, &lectura, 0) == pdTRUE) {
    if (!publicarLectura(lectura)) break;
    xQueueReceive(colaTelemetria, &lectura, 0);
  }
}

bool publicarLecturaGateway(const LecturaGateway& lectura) {
  WiFiClientSecure client;
  HTTPClient http;
  if (!iniciarHttp(http, client, String(API_BASE) + "/telemetria/gateway")) {
    return false;
  }

  JsonDocument doc;
  doc["proyecto_id"] = GATEWAY_PROJECT_ID;
  doc["gateway_mac"] = WiFi.macAddress();
  doc["temperatura_ambiente"] = lectura.temperatura_ambiente;
  doc["humedad_relativa"] = lectura.humedad_relativa;
  doc["presion_atmosferica"] = lectura.presion_atmosferica;
  doc["prueba_id"] = lectura.prueba_id;
  String body;
  serializeJson(doc, body);
  http.addHeader("Content-Type", "application/json");
  const int code = http.POST(body);
  const String responseBody = code > 0 ? http.getString() : "";
  Serial.printf("[HTTP] Telemetria BME280 -> %d\n", code);
  http.end();

  if (code < 200 || code >= 300) {
    Serial.println(responseBody);
    return false;
  }

  JsonDocument response;
  if (!deserializeJson(response, responseBody)) {
    const uint16_t id = response["data"]["gatewayNodeId"] | 0;
    if (id > 0 && id != gatewayNodeId) {
      gatewayNodeId = id;
      preferences.putUShort("gatewayNode", gatewayNodeId);
      Serial.printf("[BME280] Nodo virtual asignado: %u\n", gatewayNodeId);
    }
  }
  return true;
}

void vaciarColaTelemetriaGateway() {
  LecturaGateway lectura{};
  while (xQueuePeek(colaTelemetriaGateway, &lectura, 0) == pdTRUE) {
    if (!publicarLecturaGateway(lectura)) break;
    xQueueReceive(colaTelemetriaGateway, &lectura, 0);
  }
}

bool encolarLecturaBme(uint32_t pruebaId) {
  if (!bmeDisponible) return false;

  LecturaGateway lectura{};
  lectura.temperatura_ambiente = bme.readTemperature();
  lectura.humedad_relativa = bme.readHumidity();
  lectura.presion_atmosferica = bme.readPressure() / 100.0F;
  lectura.prueba_id = pruebaId;
  if (!isfinite(lectura.temperatura_ambiente) ||
      !isfinite(lectura.humedad_relativa) ||
      !isfinite(lectura.presion_atmosferica)) {
    Serial.println("[BME280] Lectura invalida; revisa la conexion I2C");
    return false;
  }
  if (xQueueSend(colaTelemetriaGateway, &lectura, 0) != pdTRUE) {
    Serial.println("[COLA] Telemetria BME280 llena; lectura descartada");
    return false;
  }
  Serial.printf("[BME280] T=%.2f C, HR=%.2f %%, P=%.2f hPa\n",
                lectura.temperatura_ambiente, lectura.humedad_relativa,
                lectura.presion_atmosferica);
  return true;
}

void ejecutarMuestreoBme() {
  if (!bmeDisponible) return;
  const unsigned long ahora = millis();
  if (pruebaBmeActiva && vencido(ahora, finPruebaBme)) {
    pruebaBmeActiva = false;
    pruebaBmeId = 0;
    proximaLecturaBme = ahora + TELEMETRY_INTERVAL_MS;
    Serial.println("[BME280] Muestreo intensivo finalizado");
  }
  if (!vencido(ahora, proximaLecturaBme)) return;

  encolarLecturaBme(pruebaBmeActiva ? pruebaBmeId : 0);
  proximaLecturaBme =
      ahora + (pruebaBmeActiva ? intervaloBmePrueba : TELEMETRY_INTERVAL_MS);
}

void encolarConfirmacion(uint32_t id, bool exitosa, const char* mensaje) {
  ConfirmacionPendiente item{};
  item.id = id;
  item.exitosa = exitosa;
  strlcpy(item.mensaje, mensaje, sizeof(item.mensaje));
  if (xQueueSend(colaConfirmaciones, &item, 0) != pdTRUE) {
    Serial.printf("[COLA] No se pudo guardar confirmacion %lu\n",
                  static_cast<unsigned long>(id));
  }
}

void publicarConfirmaciones() {
  const UBaseType_t disponibles = uxQueueMessagesWaiting(colaConfirmaciones);
  if (disponibles == 0) return;

  ConfirmacionPendiente items[CONFIRMATION_QUEUE_SIZE]{};
  size_t cantidad = 0;
  while (cantidad < disponibles &&
         xQueueReceive(colaConfirmaciones, &items[cantidad], 0) == pdTRUE) {
    cantidad++;
  }

  JsonDocument doc;
  JsonArray array = doc["confirmaciones"].to<JsonArray>();
  for (size_t i = 0; i < cantidad; i++) {
    JsonObject item = array.add<JsonObject>();
    item["id"] = items[i].id;
    item["exitoso"] = items[i].exitosa;
    item["mensaje"] = items[i].mensaje;
  }
  String body;
  serializeJson(doc, body);

  WiFiClientSecure client;
  HTTPClient http;
  const String url = String(API_BASE) + "/control-manual/iot/comandos/confirmaciones";
  if (!iniciarHttp(http, client, url)) {
    for (size_t i = 0; i < cantidad; i++) xQueueSend(colaConfirmaciones, &items[i], 0);
    return;
  }
  http.addHeader("Content-Type", "application/json");
  const int code = http.POST(body);
  Serial.printf("[HTTP] Confirmaciones (%u) -> %d\n",
                static_cast<unsigned>(cantidad), code);
  http.end();
  if (code < 200 || code >= 300) {
    for (size_t i = 0; i < cantidad; i++) xQueueSend(colaConfirmaciones, &items[i], 0);
  }
}

void cargarComando(JsonObject item) {
  if (cantidadComandosPendientes >= COMMAND_BUFFER_SIZE) return;
  const uint16_t nodeId = item["nodeId"] | 0;
  const bool esGateway = gatewayNodeId > 0 && nodeId == gatewayNodeId;
  const NodeConfig* node = esGateway ? nullptr : buscarNodoPorId(nodeId);
  if (!esGateway && !node) return;

  ComandoPendiente& pending = comandosPendientes[cantidadComandosPendientes];
  pending.nodoId = nodeId;
  pending.esGateway = esGateway;
  if (node) memcpy(pending.mac, node->mac, 6);
  else memset(pending.mac, 0, sizeof(pending.mac));
  JsonVariant rawId = item["id"];
  pending.comando.comando_id = rawId.is<const char*>()
                                    ? strtoul(rawId.as<const char*>(), nullptr, 10)
                                    : (rawId | 0);
  const String tipo = item["tipo_comando"] | "";
  JsonObject payload = item["payload"];
  pending.comando.prueba_id = payload["pruebaId"] | 0;
  pending.comando.componente_id = payload["componenteId"] | 0;
  pending.comando.intervalo_ms = (payload["intervaloSegundos"] | 10) * 1000UL;
  pending.comando.duracion_ms = (payload["duracionSegundos"] | 60) * 1000UL;
  pending.comando.pin = payload["pin"] | DEFAULT_ACTUATOR_PIN;
  pending.comando.activo_low = payload["activoEnLow"] | true;

  if (tipo == "INICIAR_PRUEBA_SENSOR") pending.comando.tipo = 1;
  else if (tipo == "ACTIVAR_ACTUADOR") pending.comando.tipo = 2;
  else if (tipo == "DESACTIVAR_ACTUADOR") pending.comando.tipo = 3;
  else if (tipo == "FINALIZAR_PRUEBA") pending.comando.tipo = 4;
  else if (tipo == "CONFIGURAR_INTERVALO") pending.comando.tipo = 5;
  else if (tipo == "RESTAURAR_INTERVALO") pending.comando.tipo = 6;
  else return;
  cantidadComandosPendientes++;
}

void consultarComandos() {
  String ids;
  for (const auto& node : NODES) {
    if (!node.enabled) continue;
    if (ids.length()) ids += ',';
    ids += node.id;
  }
  if (gatewayNodeId > 0) {
    if (ids.length()) ids += ',';
    ids += gatewayNodeId;
  }
  if (!ids.length()) return;

  WiFiClientSecure client;
  HTTPClient http;
  const String url = String(API_BASE) + "/control-manual/iot/comandos?nodeIds=" + ids;
  if (!iniciarHttp(http, client, url)) return;
  const int code = http.GET();
  const String body = code > 0 ? http.getString() : "";
  Serial.printf("[HTTP] Consultar comandos -> %d\n", code);
  http.end();
  if (code < 200 || code >= 300) return;

  JsonDocument doc;
  if (deserializeJson(doc, body)) return;
  cantidadComandosPendientes = 0;
  for (JsonObject item : doc["data"]["comandos"].as<JsonArray>()) cargarComando(item);
}

bool procesarComandoGateway(const MensajeComando& comando) {
  const unsigned long ahora = millis();
  if (comando.tipo == 1) {
    pruebaBmeActiva = true;
    pruebaBmeId = comando.prueba_id;
    intervaloBmePrueba =
        comando.intervalo_ms < 5000U ? 5000U : comando.intervalo_ms;
    const uint32_t duracion = comando.duracion_ms < 10000U
                                  ? 10000U
                                  : (comando.duracion_ms > 600000U
                                         ? 600000U
                                         : comando.duracion_ms);
    finPruebaBme = ahora + duracion;
    proximaLecturaBme = ahora;
    return bmeDisponible;
  }
  if (comando.tipo == 4) {
    pruebaBmeActiva = false;
    pruebaBmeId = 0;
    proximaLecturaBme = ahora + TELEMETRY_INTERVAL_MS;
    return true;
  }
  return false;
}

void enviarComandosPendientes() {
  for (size_t i = 0; i < cantidadComandosPendientes; i++) {
    ComandoPendiente& pending = comandosPendientes[i];
    const uint32_t id = pending.comando.comando_id;
    if (id <= ultimoComandoEnviado) {
      encolarConfirmacion(id, true, "Comando enviado previamente al nodo");
      continue;
    }
    esp_err_t result = ESP_OK;
    const bool ok = pending.esGateway
                        ? procesarComandoGateway(pending.comando)
                        : ((result = esp_now_send(
                                pending.mac,
                                reinterpret_cast<uint8_t*>(&pending.comando),
                                sizeof(pending.comando))) == ESP_OK);
    if (ok) {
      ultimoComandoEnviado = id;
      preferences.putULong("lastCmd", ultimoComandoEnviado);
    }
    encolarConfirmacion(
        id, ok,
        ok ? (pending.esGateway ? "Comando aplicado al BME280"
                                : "Comando enviado al nodo")
           : (pending.esGateway ? "BME280 no disponible"
                                : "Fallo enviando por ESP-NOW"));
    Serial.printf("[%s] Comando %lu al nodo %u -> %d\n",
                  pending.esGateway ? "BME280" : "ESP-NOW",
                  static_cast<unsigned long>(id), pending.nodoId,
                  ok ? 0 : result);
    delay(80);
  }
  cantidadComandosPendientes = 0;
}

void sincronizarNube() {
  detenerEspNow();
  if (!conectarWifi()) {
    restaurarEspNow();
    return;
  }
  vaciarColaTelemetria();
  vaciarColaTelemetriaGateway();
  publicarConfirmaciones();
  consultarComandos();
  restaurarEspNow();
  enviarComandosPendientes();
}

void solicitarLectura(const NodeConfig& node) {
  MensajeComando command{};
  command.tipo = 7;
  const esp_err_t result =
      esp_now_send(node.mac, reinterpret_cast<uint8_t*>(&command), sizeof(command));
  Serial.printf("[TURNO] Lectura solicitada al nodo %u -> %d\n", node.id, result);
}

void ejecutarPlanMuestreo() {
  const unsigned long ahora = millis();
  if (!cicloMuestreoActivo && vencido(ahora, proximoCiclo)) {
    cicloMuestreoActivo = true;
    indiceTurno = 0;
    proximoTurno = ahora;
    proximoCiclo = ahora + TELEMETRY_INTERVAL_MS;
    Serial.println("[TURNO] Inicia ciclo de telemetria");
  }
  if (!cicloMuestreoActivo || !vencido(ahora, proximoTurno)) return;

  while (indiceTurno < NODE_COUNT && !NODES[indiceTurno].enabled) indiceTurno++;
  if (indiceTurno >= NODE_COUNT) {
    cicloMuestreoActivo = false;
    Serial.println("[TURNO] Ciclo completado");
    return;
  }

  solicitarLectura(NODES[indiceTurno]);
  indiceTurno++;
  proximoTurno = ahora + NODE_REQUEST_SPACING_MS;
}

void setup() {
  Serial.begin(115200);
  delay(500);
  colaTelemetria = xQueueCreate(TELEMETRY_QUEUE_SIZE, sizeof(MensajeLectura));
  colaTelemetriaGateway =
      xQueueCreate(GATEWAY_TELEMETRY_QUEUE_SIZE, sizeof(LecturaGateway));
  colaConfirmaciones =
      xQueueCreate(CONFIRMATION_QUEUE_SIZE, sizeof(ConfirmacionPendiente));
  preferences.begin("riego", false);
  ultimoComandoEnviado = preferences.getULong("lastCmd", 0);
  gatewayNodeId = preferences.getUShort("gatewayNode", 0);
  Wire.begin(BME280_SDA_PIN, BME280_SCL_PIN);
  bmeDisponible = bme.begin(BME280_PRIMARY_ADDRESS, &Wire);
  if (!bmeDisponible) {
    bmeDisponible = bme.begin(BME280_PRIMARY_ADDRESS == 0x76 ? 0x77 : 0x76, &Wire);
  }
  Serial.println("\n=== GATEWAY NODALVIA: 8 NODOS ===");
  Serial.printf("Nodos activos: %u, intervalo: %lu minutos\n",
                static_cast<unsigned>(contarNodosActivos()),
                static_cast<unsigned long>(TELEMETRY_INTERVAL_MS / 60000UL));
  Serial.printf("BME280: %s, SDA=%u, SCL=%u, nodo virtual=%u\n",
                bmeDisponible ? "detectado" : "no detectado", BME280_SDA_PIN,
                BME280_SCL_PIN, gatewayNodeId);
  if (configuracionValida()) iniciarEspNow();
}

void loop() {
  if (!configuracionValida()) {
    delay(5000);
    return;
  }
  ejecutarMuestreoBme();
  ejecutarPlanMuestreo();
  if (!cicloMuestreoActivo &&
      millis() - ultimaSincronizacion >= CLOUD_SYNC_INTERVAL_MS) {
    ultimaSincronizacion = millis();
    sincronizarNube();
  }
  delay(20);
}
