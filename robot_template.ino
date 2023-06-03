//#define JSON

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#ifdef JSON
#include <ArduinoJson.h>
#endif

#define SSID "{wifi}"
#define PASSWORD "{password}"

#define MQTT_HOST "{host}"
#define MQTT_PORT {port}

#define ENA 4
#define IN1 0
#define IN2 2

#define ENB 14
#define IN3 12
#define IN4 13

const String UID = "{uid}";

const String TOPIC_POS = UID + ":pos";
const String TOPIC_CON = UID + ":con";

WiFiClient wifi_client;
PubSubClient mqtt_client(wifi_client);

unsigned long last_ping_time;

#ifdef JSON
DynamicJsonDocument json(1024);
#endif

bool eq(const char* str1, const char* str2) {
    if (strlen(str1) != strlen(str2)) return false;
    size_t i = 0;
    while (str1[i] != '\0') {
        if (str1[i] != str2[i]) {
            return false;
        }
        i++;
    }
    return true;
}

void setup_pins() {
    pinMode(ENA, OUTPUT);
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    
    pinMode(ENB, OUTPUT);
    pinMode(IN3, OUTPUT);
    pinMode(IN4, OUTPUT);

    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
}

void go(int16_t x, int16_t y) {
    if (x > 1024 || x < -1024 || y > 1024 || y < -1024) return;

    uint8_t dir;

    if (y > 0) {
        dir = HIGH;
    }
    else {
        dir = LOW;
        y = -y;
    }

    int m1 = y - x;
    int m2 = y + x;

    if (m1 > 0) {
        analogWrite(ENA, m1);
        digitalWrite(IN1, dir);
        digitalWrite(IN2, !dir);
    }
    else {
        analogWrite(ENA, -m1);
        digitalWrite(IN1, !dir);
        digitalWrite(IN2, dir);
    }
    
    if (m2 > 0) {
        analogWrite(ENB, m2);
        digitalWrite(IN3, dir);
        digitalWrite(IN4, !dir);
    }
    else {
        analogWrite(ENB, -m2);
        digitalWrite(IN3, !dir);
        digitalWrite(IN4, dir);
    }
}

void connect_wifi() {
    Serial.printf("Connecting to %s", SSID);

    WiFi.begin(SSID, PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(100);
        Serial.print('.');
    }
    
    Serial.printf("\nConnected to %s\n", SSID);
}

void connect_mqtt() {
    String client_id = "esp8266-client-";
    client_id += String(WiFi.macAddress());
    Serial.printf("Connecting to %s:%d\n", MQTT_HOST, MQTT_PORT);
    while (!mqtt_client.connected()) {
        if (mqtt_client.connect(client_id.c_str())) {
            Serial.printf("Connected to %s:%d\n", MQTT_HOST, MQTT_PORT);
            delay(100);
            continue;
        }
        Serial.println("Connection failed");
        delay(5000);
    }
}

void mqtt_callback(char* topic, unsigned char* data, unsigned int len) {
    #ifdef JSON
    deserializeJson(json, data);
    const int16_t x = json["x"];
    const int16_t y = json["y"];
    #else
    if (len != 4) return;
    const int16_t x = ((int16_t*)data)[0];
    const int16_t y = ((int16_t*)data)[1];
    #endif
    Serial.printf("x: %hd, y: %hd\n", x, y);
    go(x, y);
}

void setup() {
    Serial.begin(115200);
    setup_pins();
    connect_wifi();
    mqtt_client.setServer(MQTT_HOST, MQTT_PORT);
    connect_mqtt();
    mqtt_client.subscribe(TOPIC_POS.c_str());
    mqtt_client.setCallback(mqtt_callback);
    mqtt_client.publish(TOPIC_CON.c_str(), "");
    last_ping_time = millis();
}

void loop() {
    if (!mqtt_client.connected()) {
        connect_mqtt();
        mqtt_client.publish(TOPIC_CON.c_str(), "");
    }
    unsigned long cur_time = millis();
    if (cur_time - last_ping_time > 2500) {
        mqtt_client.publish(TOPIC_CON.c_str(), "");
        last_ping_time = cur_time;
    }
    mqtt_client.loop();
}