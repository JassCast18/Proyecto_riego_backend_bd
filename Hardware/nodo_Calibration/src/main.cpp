#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <espnow.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const int pinHumedad = A0;
const int pinTemp = 4; // GPIO4 (D2)

extern "C" {
#include <user_interface.h>
}

// MAC del ESP32 Gateway (Confirmada)
uint8_t macGateway[] = {0x30, 0x76, 0xF5, 0xA6, 0x4D, 0xA4};

OneWire oneWire(pinTemp);
DallasTemperature sensoresTemp(&oneWire);

typedef struct struct_mensaje {
  int id_nodo;
  int humedad_cruda;
  float temp_suelo;
  float bateria;
} struct_mensaje;

struct_mensaje datosNodo;

void OnDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  Serial.print("Estado del envio ESP-NOW: ");
  if (sendStatus == 0) {
    Serial.println("¡ENTREGADO (OK)!");
  } else {
    Serial.println("ERROR (No se pudo entregar)");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  
  // Forzar el canal 11 explícitamente
  wifi_set_channel(11);
  wifi_set_opmode(STATION_MODE);

  Serial.println("\n====================================");
  Serial.println("INICIANDO NODO WEMOS");
  Serial.print("MAC Wemos: ");
  Serial.println(WiFi.macAddress());

  sensoresTemp.begin();

  if (esp_now_init() != 0) {
    Serial.println("ERROR iniciando ESP-NOW en el nodo");
    return;
  }

  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);
  esp_now_register_send_cb(OnDataSent);

  int resultado = esp_now_add_peer(
      macGateway,
      ESP_NOW_ROLE_SLAVE,
      11,
      NULL,
      0);

  Serial.print("Resultado add_peer: ");
  Serial.println(resultado);
  Serial.println("===== NODO LISTO =======");
}

void loop() {
  datosNodo.id_nodo = 1;
  datosNodo.humedad_cruda = analogRead(pinHumedad);

  sensoresTemp.requestTemperatures();
  datosNodo.temp_suelo = sensoresTemp.getTempCByIndex(0);
  datosNodo.bateria = 100.0;

  wifi_set_channel(11);

  Serial.println("\nEnviando paquete por ESP-NOW...");

  int resultado = esp_now_send(
      macGateway,
      (uint8_t *)&datosNodo,
      sizeof(datosNodo));

  Serial.print("esp_now_send() codigo: ");
  Serial.println(resultado);

  Serial.print("Humedad leida: ");
  Serial.println(datosNodo.humedad_cruda);
  Serial.print("Temperatura: ");
  Serial.println(datosNodo.temp_suelo);

  delay(5000);
}