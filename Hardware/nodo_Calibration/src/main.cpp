#include <Arduino.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <OneWire.h>
#include <espnow.h>

extern "C" {
#include <user_interface.h>
}

#include "device_config.h"

constexpr uint8_t RELAY_INACTIVE_LEVEL = RELAY_ACTIVE_LOW ? HIGH : LOW;

OneWire oneWire(TEMPERATURE_PIN);
DallasTemperature sensoresTemp(&oneWire);

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

MensajeLectura datos{};
volatile uint32_t intervaloActual = INTENSIVE_INTERVAL_MS;
volatile uint32_t pruebaActual = 0;
volatile bool lecturaInmediata = false;
volatile bool muestreoIntensivo = false;
bool valvulaActiva = false;
uint8_t pinActuadorActual = RELAY_PIN;
bool activoLowActual = RELAY_ACTIVE_LOW;
uint32_t actuadorActual = 0;
uint32_t ultimoComandoProcesado = 0;
unsigned long cierreValvula = 0;
unsigned long ultimoEnvio = 0;
volatile bool envioPendiente = false;
volatile uint8_t reintentosEnvio = 0;
volatile unsigned long proximoReintento = 0;

bool pinActuadorValido(uint8_t pin) {
  return pin == 4 || pin == 5 || pin == 12 || pin == 13 || pin == 14;
}

void cerrarValvula() {
  digitalWrite(pinActuadorActual, activoLowActual ? HIGH : LOW);
  valvulaActiva = false;
  actuadorActual = 0;
  cierreValvula = 0;
}

void onCommand(uint8_t*, uint8_t* raw, uint8_t len) {
  if (len != sizeof(MensajeComando)) {
    Serial.printf("[CMD] Tamano invalido: %u, esperado %u\n", len,
                  sizeof(MensajeComando));
    return;
  }

  MensajeComando command{};
  memcpy(&command, raw, sizeof(command));
  Serial.printf("[CMD] tipo=%u comando=%lu prueba=%lu intervalo=%lu ms\n",
                command.tipo, static_cast<unsigned long>(command.comando_id),
                static_cast<unsigned long>(command.prueba_id),
                static_cast<unsigned long>(command.intervalo_ms));
  if (command.tipo == 7) {
    lecturaInmediata = true;
    Serial.println("[TURNO] Gateway solicito lectura programada");
    return;
  }
  if (command.comando_id <= ultimoComandoProcesado) {
    Serial.println("[CMD] Duplicado ignorado");
    return;
  }
  ultimoComandoProcesado = command.comando_id;

  if (command.tipo == 1) {
    pruebaActual = command.prueba_id;
    intervaloActual = command.intervalo_ms < 5000U ? 5000U : command.intervalo_ms;
    muestreoIntensivo = true;
    lecturaInmediata = true;
  } else if (command.tipo == 2) {
    if (!pinActuadorValido(command.pin)) {
      Serial.printf("[SEGURIDAD] GPIO %u rechazado para el rele\n", command.pin);
      return;
    }
    if (valvulaActiva) cerrarValvula();
    pruebaActual = command.prueba_id;
    pinActuadorActual = command.pin;
    activoLowActual = command.activo_low;
    actuadorActual = command.componente_id;
    pinMode(pinActuadorActual, OUTPUT);
    digitalWrite(pinActuadorActual, activoLowActual ? LOW : HIGH);
    valvulaActiva = true;
    intervaloActual = INTENSIVE_INTERVAL_MS;
    muestreoIntensivo = true;
    lecturaInmediata = true;
    const uint32_t safeDuration =
        command.duracion_ms > 600000U ? 600000U : command.duracion_ms;
    cierreValvula = millis() + safeDuration;
    Serial.printf("[RIEGO] Actuador %u activo en GPIO %u (%s)\n",
                  static_cast<unsigned>(actuadorActual), pinActuadorActual,
                  activoLowActual ? "LOW" : "HIGH");
  } else if (command.tipo == 3) {
    cerrarValvula();
    pruebaActual = 0;
    muestreoIntensivo = false;
    lecturaInmediata = true;
  } else if (command.tipo == 4) {
    pruebaActual = 0;
    muestreoIntensivo = false;
    lecturaInmediata = true;
  } else if (command.tipo == 5) {
    intervaloActual = command.intervalo_ms < 10000U ? 10000U : command.intervalo_ms;
    pruebaActual = 0;
    muestreoIntensivo = true;
    lecturaInmediata = true;
  } else if (command.tipo == 6) {
    pruebaActual = 0;
    muestreoIntensivo = false;
    lecturaInmediata = true;
  }
}

void onSent(uint8_t*, uint8_t status) {
  if (status == 0) {
    envioPendiente = false;
    reintentosEnvio = 0;
    Serial.println("[ESP-NOW] Lectura entregada");
    return;
  }
  if (reintentosEnvio < 8) {
    envioPendiente = true;
    proximoReintento = millis() + 1000UL;
    Serial.println("[ESP-NOW] Gateway ocupado; se reintentara la lectura");
  } else {
    envioPendiente = false;
    Serial.println("[ESP-NOW] Lectura descartada tras 8 reintentos");
  }
}

void enviarLecturaActual() {
  if (reintentosEnvio >= 8) {
    envioPendiente = false;
    Serial.println("[ESP-NOW] Lectura descartada tras 8 reintentos");
    return;
  }
  wifi_set_channel(ESPNOW_CHANNEL);
  const int result = esp_now_send(
      const_cast<uint8_t*>(GATEWAY_MAC), reinterpret_cast<uint8_t*>(&datos),
      sizeof(datos));
  envioPendiente = true;
  reintentosEnvio++;
  proximoReintento = millis() + 1000UL;
  Serial.printf("[LECTURA] humedad=%d, temp=%.2f C, prueba=%lu, envio=%d, intento=%u\n",
                datos.humedad_cruda, datos.temp_suelo,
                static_cast<unsigned long>(datos.prueba_id), result,
                reintentosEnvio);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_INACTIVE_LEVEL);
  sensoresTemp.begin();
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  wifi_set_channel(ESPNOW_CHANNEL);
  wifi_set_opmode(STATION_MODE);

  Serial.println("\n=== NODO NODALVIA ===");
  Serial.printf("Nodo: %u, MAC: %s, canal: %u, rele: GPIO %u\n", NODE_ID,
                WiFi.macAddress().c_str(), ESPNOW_CHANNEL, RELAY_PIN);
  if (esp_now_init() != 0) {
    Serial.println("[ESP-NOW] Error al iniciar");
    return;
  }
  esp_now_set_self_role(ESP_NOW_ROLE_COMBO);
  esp_now_register_send_cb(onSent);
  esp_now_register_recv_cb(onCommand);
  const int peerResult = esp_now_add_peer(
      const_cast<uint8_t*>(GATEWAY_MAC), ESP_NOW_ROLE_COMBO, ESPNOW_CHANNEL,
      nullptr, 0);
  Serial.printf("[ESP-NOW] Gateway registrado: %d\n", peerResult);
}

void loop() {
  if (valvulaActiva && static_cast<long>(millis() - cierreValvula) >= 0) {
    cerrarValvula();
    Serial.println("[SEGURIDAD] Valvula cerrada por limite local");
  }

  if (envioPendiente && static_cast<long>(millis() - proximoReintento) >= 0) {
    enviarLecturaActual();
  }

  if (lecturaInmediata ||
      (muestreoIntensivo && millis() - ultimoEnvio >= intervaloActual)) {
    lecturaInmediata = false;
    ultimoEnvio = millis();
    datos.id_nodo = NODE_ID;
    datos.humedad_cruda = analogRead(MOISTURE_PIN);
    sensoresTemp.requestTemperatures();
    datos.temp_suelo = sensoresTemp.getTempCByIndex(0);
    datos.bateria = 100;
    datos.prueba_id = pruebaActual;
    reintentosEnvio = 0;
    enviarLecturaActual();
  }
  delay(20);
}
