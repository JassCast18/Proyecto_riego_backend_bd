#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <espnow.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const int pinHumedad = A0;
const int pinTemp = 4; // GPIO 4 (D2)

const char* ssid = "Familia Castellanos";
const char* password = "TeamoJesus";

OneWire oneWire(pinTemp);
DallasTemperature sensoresTemp(&oneWire);

// MAC del ESP32 (Gateway) - ¡Verifica que sea exactamente la de tu ESP32!
uint8_t macGateway[] = {0x30, 0x76, 0xF5, 0xA6, 0x4D, 0xA4};

typedef struct struct_mensaje {
  int id_nodo;
  int humedad_cruda;
  float temp_suelo;
  float bateria;
} struct_mensaje;

struct_mensaje datosNodo;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  WiFi.begin(ssid, password);
  Serial.print("Conectando a Wi-Fi para sincronizar canal...");
  unsigned long inicioConexion = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicioConexion < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Wi-Fi conectado. Canal actual: ");
    Serial.println(WiFi.channel());
  } else {
    Serial.println();
    Serial.println("No se pudo conectar al Wi-Fi; ESP-NOW puede quedar fuera de canal.");
  }

  sensoresTemp.begin();

  if (esp_now_init() != 0) {
    Serial.println("Error iniciando ESP-NOW");
    return;
  }

  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);

  esp_now_add_peer(macGateway, ESP_NOW_ROLE_SLAVE, WiFi.channel(), NULL, 0);
  
  Serial.println("\n--- Nodo Oasis Listo ---");
}

void loop() {
  datosNodo.id_nodo = 1;
  datosNodo.humedad_cruda = analogRead(pinHumedad);
  sensoresTemp.requestTemperatures(); 
  datosNodo.temp_suelo = sensoresTemp.getTempCByIndex(0);
  datosNodo.bateria = 100.0;

  esp_now_send(macGateway, (uint8_t *) &datosNodo, sizeof(datosNodo));
  
  Serial.print("Dato enviado -> Humedad: ");
  Serial.print(datosNodo.humedad_cruda);
  Serial.print(" | Temp: ");
  Serial.println(datosNodo.temp_suelo);

  delay(5000);
}