#pragma once

#include <Arduino.h>

#ifndef NODALVIA_NODE_ID
#define NODALVIA_NODE_ID 1
#endif

static_assert(NODALVIA_NODE_ID >= 1 && NODALVIA_NODE_ID <= 8,
              "NODALVIA_NODE_ID must be between 1 and 8");

constexpr uint16_t NODE_ID = NODALVIA_NODE_ID;
constexpr uint8_t ESPNOW_CHANNEL = 11;
constexpr uint8_t MOISTURE_PIN = A0;
constexpr uint8_t TEMPERATURE_PIN = 2;
constexpr uint8_t RELAY_PIN = 4;
constexpr bool RELAY_ACTIVE_LOW = true;
constexpr uint32_t INTENSIVE_INTERVAL_MS = 10UL * 1000UL;
constexpr uint8_t GATEWAY_MAC[] = {0x30, 0x76, 0xF5, 0xA6, 0x4D, 0xA4};
