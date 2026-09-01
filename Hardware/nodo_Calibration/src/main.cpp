#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <espnow.h>
#include <OneWire.h>
#include <DallasTemperature.h>
extern "C" {
#include <user_interface.h>
}

const uint8_t PIN_RELE_VALVULA=5; // D1 / GPIO5
const uint8_t RELE_ACTIVO=LOW;
const uint8_t RELE_INACTIVO=HIGH;
const int pinHumedad=A0;const int pinTemp=4;const uint32_t INTERVALO_NORMAL_MS=15UL*60UL*1000UL;
uint8_t macGateway[]={0x30,0x76,0xF5,0xA6,0x4D,0xA4};
OneWire oneWire(pinTemp);DallasTemperature sensoresTemp(&oneWire);

struct MensajeLectura { int id_nodo; int humedad_cruda; float temp_suelo; float bateria; uint32_t prueba_id; };
struct MensajeComando { uint32_t comando_id; uint32_t prueba_id; uint32_t componente_id; uint8_t tipo; uint32_t intervalo_ms; uint32_t duracion_ms; uint8_t pin; bool activo_low; };
MensajeLectura datos{};volatile uint32_t intervaloActual=INTERVALO_NORMAL_MS;volatile uint32_t pruebaActual=0;volatile bool lecturaInmediata=true;bool valvulaActiva=false;uint8_t pinActuadorActual=PIN_RELE_VALVULA;bool activoLowActual=true;uint32_t actuadorActual=0;unsigned long cierreValvula=0;unsigned long ultimoEnvio=0;

void cerrarValvula(){digitalWrite(pinActuadorActual,activoLowActual?HIGH:LOW);valvulaActiva=false;actuadorActual=0;cierreValvula=0;}
void onCommand(uint8_t*,uint8_t* raw,uint8_t len){
 if(len!=sizeof(MensajeComando))return;
 MensajeComando command{};memcpy(&command,raw,sizeof(command));
 if(command.tipo==1){pruebaActual=command.prueba_id;intervaloActual=command.intervalo_ms<5000U?5000U:command.intervalo_ms;lecturaInmediata=true;}
 else if(command.tipo==2){if(valvulaActiva)cerrarValvula();pruebaActual=command.prueba_id;pinActuadorActual=command.pin;activoLowActual=command.activo_low;actuadorActual=command.componente_id;pinMode(pinActuadorActual,OUTPUT);digitalWrite(pinActuadorActual,activoLowActual?LOW:HIGH);valvulaActiva=true;uint32_t safeDuration=command.duracion_ms>600000U?600000U:command.duracion_ms;cierreValvula=millis()+safeDuration;Serial.printf("Actuador %u activado en GPIO %u (%s)\n",static_cast<unsigned>(actuadorActual),pinActuadorActual,activoLowActual?"LOW":"HIGH");}
 else if(command.tipo==3){cerrarValvula();pruebaActual=0;}
 else if(command.tipo==4){intervaloActual=INTERVALO_NORMAL_MS;pruebaActual=0;lecturaInmediata=true;}
}
void onSent(uint8_t*,uint8_t status){Serial.println(status==0?"Lectura entregada":"Error de entrega");}

void setup(){
 Serial.begin(115200);pinMode(PIN_RELE_VALVULA,OUTPUT);digitalWrite(PIN_RELE_VALVULA,RELE_INACTIVO);sensoresTemp.begin();WiFi.mode(WIFI_STA);WiFi.disconnect();wifi_set_channel(11);wifi_set_opmode(STATION_MODE);
 if(esp_now_init()!=0){Serial.println("Error ESP-NOW");return;}esp_now_set_self_role(ESP_NOW_ROLE_COMBO);esp_now_register_send_cb(onSent);esp_now_register_recv_cb(onCommand);esp_now_add_peer(macGateway,ESP_NOW_ROLE_COMBO,11,NULL,0);
}
void loop(){
 if(valvulaActiva&&(long)(millis()-cierreValvula)>=0){cerrarValvula();Serial.println("Válvula cerrada por failsafe local");}
 if(lecturaInmediata||millis()-ultimoEnvio>=intervaloActual){lecturaInmediata=false;ultimoEnvio=millis();datos.id_nodo=1;datos.humedad_cruda=analogRead(pinHumedad);sensoresTemp.requestTemperatures();datos.temp_suelo=sensoresTemp.getTempCByIndex(0);datos.bateria=100;datos.prueba_id=pruebaActual;wifi_set_channel(11);esp_now_send(macGateway,(uint8_t*)&datos,sizeof(datos));}
 delay(20);
}
