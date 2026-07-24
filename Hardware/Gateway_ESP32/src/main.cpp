#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>

const char* ssid = "Familia Castellanos";
const char* password = "TeamoJesus";
const char* serverName = "http://192.168.0.13:3000/api/telemetria/lecturas";

// MAC de tu Wemos (¡Verifica que sea exactamente la de tu Wemos!)
uint8_t macNodo1[] = {0xE8, 0xDB, 0x84, 0xF4, 0x9B, 0xD3};

typedef struct struct_mensaje {
  int id_nodo;
  int humedad_cruda;
  float temp_suelo;
  float bateria;
} struct_mensaje;

struct_mensaje datosRecibidos;

int rssiUltimoNodo = 0;
bool nuevoDatoListo = false;

void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  memcpy(&datosRecibidos, incomingData, sizeof(datosRecibidos));
  rssiUltimoNodo = -1; 
  nuevoDatoListo = true; 
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_AP_STA);
  WiFi.setSleep(false);
  WiFi.begin(ssid, password);
  
  Serial.print("Conectando al Router...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Conectado a Wi-Fi! IP Privada:");
  Serial.println(WiFi.localIP());
  Serial.print("Canal de Wi-Fi actual: ");
  Serial.println(WiFi.channel());

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error iniciando ESP-NOW");
    return;
  }
  
  esp_now_register_recv_cb(OnDataRecv);

  esp_now_peer_info_t infoNodo;
  memset(&infoNodo, 0, sizeof(infoNodo));
  infoNodo.ifidx = WIFI_IF_STA;
  
  memcpy(infoNodo.peer_addr, macNodo1, 6);
  infoNodo.channel = WiFi.channel();
  infoNodo.encrypt = false;

  if (esp_now_add_peer(&infoNodo) != ESP_OK){
    Serial.println("Error registrando el nodo");
    return;
  }

  Serial.println("\n--- Gateway ESP32 Listo (Modo Abierto) ---");
}

void loop() {
  if (nuevoDatoListo) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-api-key", "Oasis_Telemetria_SuperSecreta_2026");

      String jsonPayload = "{";
      jsonPayload += "\"id_nodo\":" + String(datosRecibidos.id_nodo) + ",";
      jsonPayload += "\"humedad_cruda\":" + String(datosRecibidos.humedad_cruda) + ",";
      jsonPayload += "\"temp_suelo\":" + String(datosRecibidos.temp_suelo) + ",";
      jsonPayload += "\"bateria\":" + String(datosRecibidos.bateria) + ",";
      jsonPayload += "\"rssi\":" + String(rssiUltimoNodo);
      jsonPayload += "}";

      Serial.println("\nEnviando a la API: " + jsonPayload);

      int httpResponseCode = http.POST(jsonPayload);

      if (httpResponseCode > 0) {
        Serial.print("✅ Respuesta del servidor: ");
        Serial.println(httpResponseCode);
      } else {
        Serial.print("❌ Error HTTP: ");
        Serial.println(httpResponseCode);
      }
      
      http.end();
    }
    nuevoDatoListo = false; 
  }
}