#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_now.h>
#include <esp_wifi.h>

const char* ssidRouter="HUAWEI nova 9 SE";
const char* passwordRouter="Jaser1806";
const char* apiBase="http://192.168.43.43:3000/api";
const char* iotApiKey="Oasis_Telemetria_SuperSecreta_2026";
const int nodoConfigurado=1;
uint8_t macNodo[]={0xE8,0xDB,0x84,0xF4,0x9B,0xD3};

struct MensajeLectura { int id_nodo; int humedad_cruda; float temp_suelo; float bateria; uint32_t prueba_id; };
struct MensajeComando { uint32_t comando_id; uint32_t prueba_id; uint32_t componente_id; uint8_t tipo; uint32_t intervalo_ms; uint32_t duracion_ms; uint8_t pin; bool activo_low; };
MensajeLectura datosRecibidos{};volatile bool nuevoMensaje=false;bool espNowActivo=false;unsigned long ultimoPoll=0;

void onDataRecv(const uint8_t*,const uint8_t* data,int len){if(len==sizeof(MensajeLectura)){memcpy(&datosRecibidos,data,sizeof(datosRecibidos));nuevoMensaje=true;}}
void iniciarEspNow(){WiFi.mode(WIFI_STA);WiFi.disconnect();esp_wifi_set_channel(11,WIFI_SECOND_CHAN_NONE);if(esp_now_init()!=ESP_OK){Serial.println("Error ESP-NOW");return;}esp_now_register_recv_cb(onDataRecv);esp_now_peer_info_t peer{};memcpy(peer.peer_addr,macNodo,6);peer.channel=11;peer.encrypt=false;esp_now_add_peer(&peer);espNowActivo=true;}
void detenerEspNow(){if(espNowActivo){esp_now_deinit();espNowActivo=false;}}
bool conectarWifi(){WiFi.mode(WIFI_STA);WiFi.begin(ssidRouter,passwordRouter);unsigned long start=millis();while(WiFi.status()!=WL_CONNECTED&&millis()-start<10000)delay(200);return WiFi.status()==WL_CONNECTED;}
void desconectarWifi(){WiFi.disconnect(true);delay(100);}

bool confirmarComando(uint32_t id,bool ok,const String& mensaje){
 detenerEspNow();if(!conectarWifi()){iniciarEspNow();return false;}HTTPClient http;String url=String(apiBase)+"/control-manual/iot/comandos/"+id+"/confirmar";http.begin(url);http.addHeader("Content-Type","application/json");http.addHeader("x-api-key",iotApiKey);int code=http.POST(String("{\"exitoso\":")+(ok?"true":"false")+",\"mensaje\":\""+mensaje+"\"}");http.end();desconectarWifi();iniciarEspNow();return code>=200&&code<300;
}

void procesarComando(JsonObject item){
 MensajeComando command{};command.comando_id=item["id"]|0;String type=item["tipo_comando"]|"";JsonObject payload=item["payload"];
 command.prueba_id=payload["pruebaId"]|0;command.componente_id=payload["componenteId"]|0;command.intervalo_ms=(payload["intervaloSegundos"]|10)*1000UL;command.duracion_ms=(payload["duracionSegundos"]|60)*1000UL;command.pin=payload["pin"]|5;command.activo_low=payload["activoEnLow"]|true;
 if(type=="INICIAR_PRUEBA_SENSOR")command.tipo=1;else if(type=="ACTIVAR_ACTUADOR")command.tipo=2;else if(type=="DESACTIVAR_ACTUADOR")command.tipo=3;else if(type=="FINALIZAR_PRUEBA")command.tipo=4;else return;
 iniciarEspNow();esp_err_t sent=esp_now_send(macNodo,(uint8_t*)&command,sizeof(command));delay(250);confirmarComando(command.comando_id,sent==ESP_OK,sent==ESP_OK?"Comando enviado al nodo":"Fallo enviando por ESP-NOW");
}

void consultarComandos(){
 detenerEspNow();if(!conectarWifi()){desconectarWifi();iniciarEspNow();return;}HTTPClient http;String url=String(apiBase)+"/control-manual/iot/nodos/"+nodoConfigurado+"/comandos";http.begin(url);http.addHeader("x-api-key",iotApiKey);int code=http.GET();String body=code>0?http.getString():"";http.end();desconectarWifi();
 if(code>=200&&code<300){JsonDocument doc;if(!deserializeJson(doc,body)){JsonArray commands=doc["data"]["comandos"].as<JsonArray>();for(JsonObject command:commands)procesarComando(command);}}
 if(!espNowActivo)iniciarEspNow();
}

void enviarLectura(){
 detenerEspNow();if(!conectarWifi()){desconectarWifi();iniciarEspNow();return;}HTTPClient http;http.begin(String(apiBase)+"/telemetria/lecturas");http.addHeader("Content-Type","application/json");http.addHeader("x-api-key",iotApiKey);JsonDocument doc;doc["id_nodo"]=datosRecibidos.id_nodo;doc["humedad_cruda"]=datosRecibidos.humedad_cruda;doc["temp_suelo"]=datosRecibidos.temp_suelo;doc["prueba_id"]=datosRecibidos.prueba_id;String payload;serializeJson(doc,payload);int code=http.POST(payload);Serial.printf("Lectura enviada HTTP %d, prueba %lu\n",code,(unsigned long)datosRecibidos.prueba_id);http.end();desconectarWifi();iniciarEspNow();
}

void setup(){Serial.begin(115200);delay(500);iniciarEspNow();}
void loop(){if(nuevoMensaje){nuevoMensaje=false;enviarLectura();}if(millis()-ultimoPoll>=5000){ultimoPoll=millis();consultarComandos();}delay(20);}
