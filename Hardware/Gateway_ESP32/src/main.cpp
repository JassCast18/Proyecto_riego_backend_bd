#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <time.h>

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

struct ConfirmacionPendiente {
  uint32_t id;
  bool exitosa;
  char mensaje[80];
};

struct ComandoPendiente {
  MensajeComando comando;
  uint16_t nodoId;
  uint8_t mac[6];
};

QueueHandle_t colaTelemetria = nullptr;
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
    Serial.println("[CONFIG] Debe existir al menos un nodo habilitado");
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
  const NodeConfig* node = buscarNodoPorId(nodeId);
  if (!node) return;

  ComandoPendiente& pending = comandosPendientes[cantidadComandosPendientes];
  pending.nodoId = nodeId;
  memcpy(pending.mac, node->mac, 6);
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

void enviarComandosPendientes() {
  for (size_t i = 0; i < cantidadComandosPendientes; i++) {
    ComandoPendiente& pending = comandosPendientes[i];
    const uint32_t id = pending.comando.comando_id;
    if (id <= ultimoComandoEnviado) {
      encolarConfirmacion(id, true, "Comando enviado previamente al nodo");
      continue;
    }
    const esp_err_t result = esp_now_send(
        pending.mac, reinterpret_cast<uint8_t*>(&pending.comando),
        sizeof(pending.comando));
    const bool ok = result == ESP_OK;
    if (ok) {
      ultimoComandoEnviado = id;
      preferences.putULong("lastCmd", ultimoComandoEnviado);
    }
    encolarConfirmacion(id, ok,
                        ok ? "Comando enviado al nodo" : "Fallo enviando por ESP-NOW");
    Serial.printf("[ESP-NOW] Comando %lu al nodo %u -> %d\n",
                  static_cast<unsigned long>(id), pending.nodoId, result);
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
  colaConfirmaciones =
      xQueueCreate(CONFIRMATION_QUEUE_SIZE, sizeof(ConfirmacionPendiente));
  preferences.begin("riego", false);
  ultimoComandoEnviado = preferences.getULong("lastCmd", 0);
  Serial.println("\n=== GATEWAY NODALVIA: 8 NODOS ===");
  Serial.printf("Nodos activos: %u, intervalo: %lu minutos\n",
                static_cast<unsigned>(contarNodosActivos()),
                static_cast<unsigned long>(TELEMETRY_INTERVAL_MS / 60000UL));
  if (configuracionValida()) iniciarEspNow();
}

void loop() {
  if (!configuracionValida()) {
    delay(5000);
    return;
  }
  ejecutarPlanMuestreo();
  if (!cicloMuestreoActivo &&
      millis() - ultimaSincronizacion >= CLOUD_SYNC_INTERVAL_MS) {
    ultimaSincronizacion = millis();
    sincronizarNube();
  }
  delay(20);
}
