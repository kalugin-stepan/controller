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
    connected = false
    pinged = false

    on_connection_event_handler = null
    on_disconnection_event_handler = null

    constructor(joy_selector, mqtt_url, img=undefined) {
        this.lastpos = ''
        this.mqtt_conn = mqtt.connect(mqtt_url)
        this.uid = GetCookie('uid')
        this.joy = new Joy(joy_selector)
        this.img = img
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
        if (this.img !== undefined) this.mqtt_conn.subscribe(this.uid + ':img')

        this.mqtt_conn.on('message', (topic, payload) => {
            if (topic === this.uid + ':con') {
                this.pinged = true
                if (!this.connected) {
                    this.connected = true
                    if (this.on_connection_event_handler !== null) this.on_connection_event_handler()
                }
                return
            }
            const data = payload.toString('base64')
            this.img.src = `data:image/jpg;base64,${data}`
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
        const pos = JSON.stringify(this.joy.GetPos())
        this.mqtt_conn.publish(this.uid + ':pos', pos)
    }
}
