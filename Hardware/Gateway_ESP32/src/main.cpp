#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <esp_now.h>
#include <esp_wifi.h>

const char* ssidRouter = "HUAWEI nova 9 SE";
const char* passwordRouter = "Jaser1806";

// URL exacta combinando el prefijo de Express y tu ruta POST "/lecturas"
const char* servidorAPI = "http://192.168.43.43:3000/api/telemetria/lecturas"; 
const char* iotApiKey = "Oasis_Telemetria_SuperSecreta_2026";

typedef struct struct_mensaje {
  int id_nodo;
  int humedad_cruda;
  float temp_suelo;
  float bateria;
} struct_mensaje;

struct_mensaje datosRecibidos;
volatile bool nuevoMensaje = false;

uint8_t macNodo[] = {0xE8, 0xDB, 0x84, 0xF4, 0x9B, 0xD3};

void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len) {
  if (len == sizeof(struct_mensaje)) {
    memcpy(&datosRecibidos, incomingData, sizeof(struct_mensaje));
    nuevoMensaje = true;
  } else {
    Serial.print("Tamaño incorrecto recibido: ");
    Serial.println(len);
  }
}

void iniciarESPNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(11, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ERROR iniciando ESP-NOW");
    return;
  }
  
  esp_now_register_recv_cb(OnDataRecv);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, macNodo, 6);
  peerInfo.channel = 11; 
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  Serial.println("--- [MODO ESP-NOW ACTIVO] Escuchando al nodo... ---");
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  iniciarESPNow();
}

void loop() {
  if (nuevoMensaje) {
    nuevoMensaje = false;

    Serial.println("\n==================================");
    Serial.println("¡DATOS RECIBIDOS DEL NODO POR ESP-NOW!");
    Serial.print("ID Nodo: "); Serial.println(datosRecibidos.id_nodo);
    Serial.print("Humedad: "); Serial.println(datosRecibidos.humedad_cruda);
    Serial.print("Temperatura: "); Serial.println(datosRecibidos.temp_suelo);
    Serial.print("Bateria: "); Serial.println(datosRecibidos.bateria);
    Serial.println("==================================");

    // 1. Apagar ESP-NOW para liberar la antena
    esp_now_deinit();

    // 2. Conectar al Wi-Fi del router
    Serial.println("Conectando al Wi-Fi del router para enviar a la API...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssidRouter, passwordRouter);

    unsigned long inicioConexion = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - inicioConexion < 10000) {
      delay(500);
      Serial.print(".");
    }

    // 3. Enviar a la API mediante POST JSON con la API Key en los headers
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWi-Fi conectado. Enviando JSON con API Key...");
      
      WiFiClient client;
      HTTPClient http;

      http.begin(client, servidorAPI);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-api-key", iotApiKey);

      String jsonPayload = "{\"id_nodo\":" + String(datosRecibidos.id_nodo) + 
                           ",\"humedad_cruda\":" + String(datosRecibidos.humedad_cruda) + 
                           ",\"temp_suelo\":" + String(datosRecibidos.temp_suelo) + "}";

      int httpResponseCode = http.POST(jsonPayload);

      if (httpResponseCode > 0) {
        String responseString = http.getString();
        Serial.print("Código HTTP: ");
        Serial.println(httpResponseCode);
        Serial.print("Respuesta de la API: ");
        Serial.println(responseString);
      } else {
        Serial.print("Error en la petición POST. Código: ");
        Serial.println(httpResponseCode);
      }
      http.end();
      
      WiFi.disconnect(true);
    } else {
      Serial.println("\nError: No se pudo conectar al router a tiempo.");
    }

    // 4. Volver a encender ESP-NOW
    Serial.println("Regresando al modo ESP-NOW...");
    iniciarESPNow();
  }
}