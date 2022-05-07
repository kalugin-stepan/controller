# Набор команд

## Команды сервера

* **topic:** `'${uid}:pos'`, **value:** `'{"X": 0, "Y": 0}'` - JSON-строка с координатами направления движения 'X' и 'Y' (X, Y ∈ [-100; 100] ∪ Z)
* **topic:** `'${uid}:conn'`, **value:** `'1'`/`'0'` - ответ на запрос подключения ('1' - подкючение одобрено, '0' - подключение отклонено)
* **topic:** `'${uid}:ping'`, **value:** `''` - проверка соеденения с клиентом методом ping-а

## Подробнее про координаты

* Координата `'Y'` отвечает за скорость и направление движения (если `'Y'` > 0 - вперёд, если `'Y'` < 0 - назад)
* Координата `'X'` отвечает за угол поворота (если `'X'` > 0 - направо, если `'X'` < 0 - налево)

## Команды клиента

* **topic:** `'connection'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - запрос на подключение к серверу с вложенной идентификационной строкой
* **topic:** `'ping'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - проверка соеденения с сервером методом ping-а с вложенной идентификационной строкой

## Пример клиентского приложения

```js
// Подключение библиотеки MQTT
const mqtt = require('mqtt')
const fs = require('fs')
const { exit } = require('process')

const config = JSON.parse(fs.readFileSync('./config.json'))

// Подключение к MQTT серверу
const conn = mqtt.connect(`mqtt://${config.mqtt_host}:${config.mqtt_port}`)

// ID пользователя
const uid = '3430deab-320c-4d5b-ace1-9d8efe0b4363'

// Отправка запроса на соеденение с сервером,
// с вложенным ID пользователя закодированным в через md5
conn.publish('connection', uid)

// Подписка на ответы и информацию от сервера,
// в фориате 'ID:команда'
conn.subscribe(uid+':pos')
conn.subscribe(uid+':ping')
conn.subscribe(uid+':conn')

conn.on('message', (topic, data) => {
    if (topic === uid+':pos') {
        // Приём, конвертация и обработка данных с сервера
        console.log(JSON.parse(data))
        return
    }
    if (topic === uid+':ping') {
        // Проверка соеденения с сервером методом ping-а
        conn.publish('ping', uid)
        return
    }
    if (topic === uid+':conn') {
        // Обработка ответа на запроса на подключения к серверу
        // Если ответ равен '0' то подключение отвергнуто,
        // и тогда клиентское приложение закрывает соеденение
        const answer = data.toString()
        if (answer === '0') {
            conn.end(true)
            exit()
        }
    }
})
```
