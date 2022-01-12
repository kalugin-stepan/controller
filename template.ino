#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <MD5Builder.h>

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

#define uid "{uid}"

#define topic_pos "{uid}:pos"
#define topic_ping "{uid}:ping"
#define topic_conn "{uid}:conn"

DynamicJsonDocument json(1024);

WiFiClient wifi_client;
PubSubClient mqtt_client(wifi_client);

char md5_uid[36];

bool eq(const char* str1, const char* str2) {
    size_t i = 0;
    while (str1[i] != '\0') {
        if (str1[i] != str2[i]) {
            return false;
        }
        i++;
    }
    return true;
}

void print_bytes(byte* bytes, unsigned int len) {
    for (unsigned int x = 0; x < len; x++) {
        Serial.print((char)bytes[x]);
    }
    Serial.print("\n");
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

void go(int x, int y) {
    if (x > 100 || x < -100 || y > 100 || y < -100) {
        return;
    }

     if (y >= 0) {
        analogWrite(ENA, y*10-x*5);
        digitalWrite(IN1, HIGH);
        digitalWrite(IN2, LOW);
        
        analogWrite(ENB, y*10+x*5);
        digitalWrite(IN3, HIGH);
        digitalWrite(IN4, LOW);
    }
    else if (y < 0) {
        analogWrite(ENA, y*-10+x*5);
        digitalWrite(IN1, LOW);
        digitalWrite(IN2, HIGH);
        
        analogWrite(ENB, y*-10-x*5);
        digitalWrite(IN3, LOW);
        digitalWrite(IN4, HIGH);
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

void mqtt_callback(char* topic, byte* data, unsigned int len) {
    if (eq(topic, topic_pos)) {
        deserializeJson(json, data);
        int x = json["X"];
        int y = json["Y"];
        Serial.printf("X: %d, Y: %d\n", x, y);
        go(x, y);
        return;
    }
    if (eq(topic, topic_ping)) {
        mqtt_client.publish("ping", md5_uid);
        return;
    }
}

void setup() {
    Serial.begin(115200);
    setup_pins();
    connect_wifi();
    mqtt_client.setServer(mqtt_host, mqtt_port);
    connect_mqtt();
    mqtt_client.subscribe(topic_pos);
    mqtt_client.subscribe(topic_ping);
    mqtt_client.subscribe(topic_conn);
    mqtt_client.setCallback(mqtt_callback);
    MD5Builder md5;
    md5.begin();
    md5.add(uid);
    md5.calculate();
    md5.getChars(md5_uid);
    Serial.println(md5_uid);
    mqtt_client.publish("connection", md5_uid);
}

void loop() {
    if (!mqtt_client.connected()) {
        connect_mqtt();
        mqtt_client.publish("connection", md5_uid);
    }
    mqtt_client.loop();
}
