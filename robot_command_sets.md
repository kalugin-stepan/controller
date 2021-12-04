# Набор команд

## Команды сервера

* **topic:** `'${uid}:p'`, **value:** `'{"X": 0, "Y": 0}'` - координаты направления движения (X, Y ∈ [-100; 100] ∪ Z)
* **topic:** `'${uid}:c'`, **value:** `'1'/'0'` - ответ на запрос подключения
* **topic:** `'${uid}:ping'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - проверка соеденения

## Команды клиента

* **topic:** `'connection'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - запрос на подключение
* **topic:** `'ping'`, **value:** `'3430deab-320c-4d5b-ace1-9d8efe0b4363'` - проверка соеденения

## Пример клиентского приложения

```js
const mqtt = require("mqtt")

const conn = mqtt.connect("mqtt://localhost:1883")

const uid = "3430deab-320c-4d5b-ace1-9d8efe0b4363"

conn.publish("connection", uid)

conn.subscribe(uid+":p")
conn.subscribe(uid+":ping")
conn.subscribe(uid+":c")

conn.on("message", (topic, data) => {
    if (topic === uid+":p") {
        console.log(data.toString())
        return
    }
    if (topic === uid+":ping") {
        conn.publish("ping", uid)
        return
    }
    if (topic === uid+":c") {
        const answer = data.toString()
        if (answer === "0") {
            conn.end(true)
            return
        }
    }
})
```
