# Набор команд

## Команды сервера

* **topic:** `'${uid}:pos'`, **value:** `'{"X": 0, "Y": 0}'` - JSON-строка с координатами направления движения 'X' и 'Y' (X, Y ∈ [-100; 100] ∪ Z)
* **topic:** `'${uid}:conn'`, **value:** `'1'`/`'0'` - ответ на запрос подключения ('1' - подкючение одобрено, '0' - подключение отклонено)
* **topic:** `'${uid}:ping'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - проверка соеденения с клиентом методом ping-а

## Команды клиента

* **topic:** `'connection'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - запрос на подключение к серверу с вложенным ID пользователя
* **topic:** `'ping'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - проверка соеденения с сервером методом ping-а

## Пример клиентского приложения

```js
const mqtt = require("mqtt")

// Подключение к MQTT серверу
const conn = mqtt.connect("mqtt://localhost:1883")

// ID пользователя
const uid = "3430deab-320c-4d5b-ace1-9d8efe0b4363"

// Отправка запроса на соеденение
conn.publish("connection", uid)

// Подписка на ответы и информацию от сервера
conn.subscribe(uid+":pos")
conn.subscribe(uid+":ping")
conn.subscribe(uid+":conn")

conn.on("message", (topic, data) => {
    if (topic === uid+":pos") {
        // Приём, конвертация и обработка данных с сервера
        console.log(JSON.parse(data))
        return
    }
    if (topic === uid+":ping") {
        // Проверка соеденения с сервером методом ping-а
        conn.publish("ping", uid)
        return
    }
    if (topic === uid+":conn") {
        // Обработка ответа на запроса на подключения к серверу
        const answer = data.toString()
        if (answer === "0") {
            conn.end(true)
            return
        }
    }
})```
