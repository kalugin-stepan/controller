#include <Arduino.h>
#include <WiFi.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_camera.h"

#define SSID "Izobretay_Luxury" // Wifi SSID
#define PASSWORD "SkazhiteI"    // Wifi password

#define SERVER_NAME "192.168.0.105"

#define SERVER_PORT 8080

#define ID "8863ec56-17d8-48bb-ad7d-1c34eb3f12df"

WiFiClient client;

// CAMERA_MODEL_AI_THINKER
#define CAMERA_MODEL_AI_THINKER
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// #define DEBUG

void setup()
{
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
    Serial.begin(115200);

    WiFi.mode(WIFI_STA);
#ifdef DEBUG
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(SSID);
#endif
    WiFi.begin(SSID, PASSWORD);
    while (WiFi.status() != WL_CONNECTED)
    {
    #ifdef DEBUG
        Serial.print(".");
    #endif
        delay(500);
    }
#ifdef DEBUG
    Serial.println();
    Serial.print("ESP32-CAM IP Address: ");
    Serial.println(WiFi.localIP());
#endif

    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    if (psramFound())
    {
        config.frame_size = FRAMESIZE_SVGA;
        config.jpeg_quality = 15; // 0-63 lower number means higher quality
        config.fb_count = 2;
    }
    else
    {
        config.frame_size = FRAMESIZE_CIF;
        config.jpeg_quality = 17; // 0-63 lower number means higher quality
        config.fb_count = 1;
    }

    // camera init
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK)
    {
    #ifdef DEBUG
        Serial.printf("Camera init failed with error 0x%x", err);
    #endif
        delay(1000);
        ESP.restart();
    }
}

void loop()
{
    if (client.connect(SERVER_NAME, SERVER_PORT))
    {
    #ifdef DEBUG
        Serial.println("connected");
    #endif
        client.write(ID);
        while (client.connected())
        {
            Serial.println("Still connected\n");

            camera_fb_t *fb = NULL;
            fb = esp_camera_fb_get();
            if (!fb)
            {
            #ifdef DEBUG
                Serial.println("Camera capture failed");
            #endif
                delay(1000);
                ESP.restart();
                return;
            }

            uint8_t *fbBuf = fb->buf;
            size_t fbLen = fb->len;

        #ifdef DEBUG
            Serial.println(fbLen);
        #endif

            for (size_t n = 0; n < fbLen; n += 1024)
            {
                if (n + 1024 < fbLen)
                {
                    client.write(fbBuf, 1024);
                    fbBuf += 1024;
                }
                else if (fbLen % 1024 > 0)
                {
                    size_t remainder = fbLen % 1024;
                    client.write(fbBuf, remainder);
                }
            }

            Serial.println("sent");

            client.flush();

            esp_camera_fb_return(fb);
        }
    #ifdef DEBUG
        Serial.println("disconnected");
    #endif
        client.stop();
        return;
    }
#ifdef DEBUG
    Serial.println("connection failed!]");
#endif
    client.stop();
}