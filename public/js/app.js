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
    data = new Int16Array(2)
    
    connected = false
    pinged = false

    on_connection_event_handler = null
    on_disconnection_event_handler = null

    constructor(controls_selector, mqtt_url) {
        this.mqtt_conn = mqtt.connect(mqtt_url)
        this.uid = GetCookie('uid')
        this.events()
    }

    on_connect(handler) {
        this.on_connection_event_handler = handler
    }

    on_disconnect(handler) {
        this.on_disconnection_event_handler = handler
    }

    events() {
        const btns = document.querySelectorAll('#buttons button')
        const speed = document.getElementById('speed')
        const speed_value = document.getElementById('speed_value')
        btns.forEach(btn => {
            const ondown = () => {
                btn.classList.add('clicked')
                if (btn.innerText === 'F') {
                    this.data[1] += 100 * parseInt(speed.value)
                    console.log(this.data)
                    return
                }
                if (btn.innerText === 'B') {
                    this.data[1] -= 100 * parseInt(speed.value)
                    return
                }
                if (btn.innerText === 'L') {
                    this.data[0] -= 100 * parseInt(speed.value)
                    return
                }
                if (btn.innerText === 'R') {
                    this.data[0] += 100 * parseInt(speed.value)
                    return
                }
            }
            btn.onmousedown = ondown
            btn.ontouchstart = ondown
            const onup = () => {
                btn.classList.remove('clicked')
                if (btn.innerText === 'F') {
                    this.data[1] -= 100 * parseInt(speed.value)
                    console.log(this.data)
                    return
                }
                if (btn.innerText === 'B') {
                    this.data[1] += 100 * parseInt(speed.value)
                    return
                }
                if (btn.innerText === 'L') {
                    this.data[0] += 100 * parseInt(speed.value)
                    return
                }
                if (btn.innerText === 'R') {
                    this.data[0] -= 100 * parseInt(speed.value)
                    return
                }
            }
            btn.onmouseup = onup
            btn.ontouchend = onup
            btn.ontouchcancel = onup
        })
        document.getElementById('speed').onchange = (e) => {
            speed_value.innerText = e.target.value
        }

        this.mqtt_conn.subscribe(this.uid + ':con')

        this.mqtt_conn.on('message', (topic, payload) => {
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
        this.mqtt_conn.publish(this.uid + ':pos', new Uint8Array(this.data.buffer))
    }
}
