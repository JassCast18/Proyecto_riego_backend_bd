#pragma once

#include <Arduino.h>

constexpr char API_BASE[] =
    "https://wxo55o4ow1.execute-api.us-east-2.amazonaws.com/api";
constexpr uint8_t ESPNOW_CHANNEL = 11;
constexpr uint8_t DEFAULT_ACTUATOR_PIN = 4;
constexpr uint16_t GATEWAY_PROJECT_ID = 1;
constexpr uint8_t BME280_SDA_PIN = 21;
constexpr uint8_t BME280_SCL_PIN = 22;
constexpr uint8_t BME280_PRIMARY_ADDRESS = 0x76;
constexpr uint32_t TELEMETRY_INTERVAL_MS = 15UL * 60UL * 1000UL;
constexpr uint32_t NODE_REQUEST_SPACING_MS = 3000UL;
constexpr uint32_t CLOUD_SYNC_INTERVAL_MS = 5000UL;
constexpr size_t TELEMETRY_QUEUE_SIZE = 32;
constexpr size_t GATEWAY_TELEMETRY_QUEUE_SIZE = 16;
constexpr size_t CONFIRMATION_QUEUE_SIZE = 40;
constexpr size_t COMMAND_BUFFER_SIZE = 40;

struct NodeConfig {
  uint16_t id;
  uint8_t mac[6];
  bool enabled;
};

// Fill each MAC and change enabled to true when installing a new node.
constexpr NodeConfig NODES[] = {
    {1, {0xE8, 0xDB, 0x84, 0xF4, 0x9B, 0xD3}, true},
    {2, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
    {3, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
    {4, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
    {5, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
    {6, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
    {7, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
    {8, {0x00, 0x00, 0x00, 0x00, 0x00, 0x00}, false},
};

constexpr size_t NODE_COUNT = sizeof(NODES) / sizeof(NODES[0]);
