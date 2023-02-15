//#define JSON

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#ifdef JSON
#include <ArduinoJson.h>
#endif

#define ssid "{wifi}"
#define password "{password}"

#define mqtt_host "{host}"
#define mqtt_port {port}

#define ENA 4
#define IN1 0
#define IN2 2

#define ENB 14
#define IN3 12
#define IN4 13

const String uid = "{uid}";

const String topic_pos = uid + ":pos";
const String topic_con = uid + ":con";

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

void go(int8_t x, int8_t y) {
    if (x > 100 || x < -100 || y > 100 || y < -100) {
        return;
    }

     if (y >= 0) {
        if (x >= 0) {
            analogWrite(ENA, abs(y*10 - x*5));
            digitalWrite(IN1, HIGH);
            digitalWrite(IN2, LOW);
            
            analogWrite(ENB, y*10);
            digitalWrite(IN3, HIGH);
            digitalWrite(IN4, LOW);
        }
        else {
            x *= -1;
            analogWrite(ENA, y*10);
            digitalWrite(IN1, HIGH);
            digitalWrite(IN2, LOW);
            
            analogWrite(ENB, abs(y*10 - x*5));
            digitalWrite(IN3, HIGH);
            digitalWrite(IN4, LOW);
        }
    }
    else if (y < 0) {
        y *= -1;
        if (x >= 0) {
            analogWrite(ENA, abs(y*10 - x*5));
            digitalWrite(IN1, LOW);
            digitalWrite(IN2, HIGH);
            
            analogWrite(ENB, y*10);
            digitalWrite(IN3, LOW);
            digitalWrite(IN4, HIGH);
        }
        else {
            analogWrite(ENA, y*10);
            digitalWrite(IN1, LOW);
            digitalWrite(IN2, HIGH);
            
            analogWrite(ENB, abs(y*10 - x*5));
            digitalWrite(IN3, LOW);
            digitalWrite(IN4, HIGH);
        }
    }
}

void connect_wifi() {
    delay(100);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(100);
    }
    
    Serial.printf("Connected to %s\n", ssid);
}

void connect_mqtt() {
    String client_id = "esp8266-client-";
    client_id += String(WiFi.macAddress());
    Serial.println(client_id);
    while (!mqtt_client.connected()) {
        if (mqtt_client.connect(client_id.c_str())) {
            Serial.printf("Connected to %s:%d\n", mqtt_host, mqtt_port);
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
    const int8_t x = json["X"];
    const int8_t y = json["Y"];
    #else
    if (len != 2) return;
    const int8_t x = data[0];
    const int8_t y = data[1];
    #endif
    Serial.printf("X: %hhd, Y: %hhd\n", x, y);
    go(x, y);
}

void setup() {
    Serial.begin(115200);
    setup_pins();
    connect_wifi();
    mqtt_client.setServer(mqtt_host, mqtt_port);
    connect_mqtt();
    mqtt_client.subscribe(topic_pos.c_str());
    mqtt_client.setCallback(mqtt_callback);
    mqtt_client.publish(topic_con.c_str(), "");
    last_ping_time = millis();
}

void loop() {
    if (!mqtt_client.connected()) {
        connect_mqtt();
        mqtt_client.publish(topic_con.c_str(), "");
    }
    unsigned long cur_time = millis();
    if (cur_time - last_ping_time > 2500) {
        mqtt_client.publish(topic_con.c_str(), "");
        last_ping_time = cur_time;
    }
    mqtt_client.loop();
}