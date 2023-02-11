function GetCookie(cname) {
    const name = cname + '='
    const decodedCookie = decodeURIComponent(document.cookie)
    const ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }
    return ''
}

class App {
    data = new Uint8Array(2)
    
    connected = false
    pinged = false

    on_connection_event_handler = null
    on_disconnection_event_handler = null

    constructor(joy_selector, mqtt_url) {
        this.mqtt_conn = mqtt.connect(mqtt_url)
        this.uid = GetCookie('uid')
        this.joy = new Joy(joy_selector)
        this.events()
    }

    on_connect(handler) {
        this.on_connection_event_handler = handler
    }

    on_disconnect(handler) {
        this.on_disconnection_event_handler = handler
    }

    events() {
        this.mqtt_conn.subscribe(this.uid + ':con')

        this.mqtt_conn.on('message', (topic, payload) => {
            console.log('ping')
            this.pinged = true
            if (!this.connected) {
                this.connected = true
                if (this.on_connection_event_handler !== null) this.on_connection_event_handler()
            }
        })

        setInterval(() => {
            if (this.pinged) {
                this.pinged = false
                return
            }
            this.connected = false
            if (this.on_disconnection_event_handler !== null) this.on_disconnection_event_handler()
        }, 5000)
    }

    SendPos() {
        if (!this.connected) return
        this.data[0] = this.joy.X
        this.data[1] = this.joy.Y
        this.mqtt_conn.publish(this.uid + ':pos', this.data)
    }
}
