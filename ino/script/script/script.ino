#include <ArduinoJson.h>
#include <ESP8266WiFi.h>



int ENA = 4; //D2
int IN1 = 0; //D3
int IN2 = 2; //D4

int ENB = 14; //D5
int IN3 = 12; //D6
int IN4 = 13; //D7

int MAX_V=1000; // max = 1024 
int k;

// Название Wi-Fi сети, к которой подключаться
const char* ssid = "Izobretay_Luxuary";
// Пароль от Wi-Fi
const char* password = "SkazhiteI";

// IP-адрес сервера, к которому подключается nodeMCU
const char* host = "10.71.0.89";
// Порт сервера, ...
const int port = 2000;
//ID дрона
const char* uid = "4bb4385f-fd37-42bf-b576-933a2bc04ff3";

void setup() 
{
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

 // Здесь происходит инициализация (подключение к wi-fi сети, если указано все верно выше, то будет работать без проблем)
 Serial.begin(115200);
 Serial.printf("Connecting to %s ", ssid); 
 WiFi.begin(ssid, password);
 while(WiFi.status() != WL_CONNECTED) 
      {
       delay(500);
       Serial.print(".");
      }
  Serial.println("\nconnected");
}


void loop() {
    // Основной код, тут запускается клиент, который подключается к серверу, пока сервер соединен, то в serial будут выводиться сообщения, отправленные с сервера  
    WiFiClient client;

    Serial.printf("\n[Connecting to %s ...", host);
    if (client.connect(host, port)) {
        Serial.println("connected");

        client.write(uid);
        String line = client.readStringUntil('\n');
        Serial.println(line);
        if (line == "1") {
          Serial.println("uuid opened");
          while (client.connected()) {
            if (client.available()) {
                String line = client.readStringUntil('\n');
                Serial.println(line);

                int line_len = line.length() + 1; 
                char line_array[line_len];
                line.toCharArray(line_array, line_len);
                DynamicJsonDocument data(1024);
                deserializeJson(data, line_array);
                int x = data["X"];
                int y = data["Y"];
                if (y >= 0) {
                    analogWrite(ENA, y*10+x*5);
                    digitalWrite(IN1, HIGH);
                    digitalWrite(IN2, LOW);
                    
                    analogWrite(ENB, y*10-x*5);
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
          }
        }
        else {
          Serial.println("uuid closed");
        }
        client.stop();
        Serial.println("\nDisconnected");

        digitalWrite(IN1, LOW);
        digitalWrite(IN2, LOW);
        digitalWrite(IN3, LOW);
        digitalWrite(IN4, LOW);
        
    } else {
        Serial.println("connection failed!");
        client.stop();
    }
    delay(2000);
}
