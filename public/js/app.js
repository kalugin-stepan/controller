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

    directions = {
        forward: false,
        back: false,
        left: false,
        right: false
    }

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
        const key_direction = {
            KeyW: 'forward',
            KeyS: 'back',
            KeyA: 'left',
            KeyD: 'right'
        }

        const ondown = direction => {
            this.directions[direction] = true
        }

        const onup = direction => {
            this.directions[direction] = false
        }
        
        document.addEventListener('keydown', e => {
            if (key_direction[e.code] === undefined || e.repeat) return
            ondown(key_direction[e.code])
        })
        document.addEventListener('keyup', e => {
            if (key_direction[e.code] === undefined) return
            onup(key_direction[e.code])
        })

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

    SendPos(k) {
        if (!this.connected) return

        const data = this.joy.GetPos(k*100)

        if (data[0] === 0 && data[1] === 0) {
            if (
                (this.directions.forward && this.directions.back)
                ||
                (!this.directions.forward && !this.directions.back)
            ) {
                if (this.directions.left && this.directions.right) {}
                else if (this.directions.left) {
                    data[0] += 100 * k
                    data[1] -= 100 * k
                }
                else if (this.directions.right) {
                    data[0] -= 100 * k
                    data[1] += 100 * k
                }
            }
    
            else if (this.directions.forward) {
                data[0] += 100 * k
                data[1] += 100 * k
    
                if (this.directions.left && this.directions.right) {}
                else if (this.directions.left) {
                    data[1] -= 50 * k
                }
                else if (this.directions.right) {
                    data[0] -= 50 * k
                }
            }
    
            else if (this.directions.back) {
                data[0] -= 100 * k
                data[1] -= 100 * k
    
                if (this.directions.left && this.directions.right) {}
                else if (this.directions.left) {
                    data[1] += 50 * k
                }
                else if (this.directions.right) {
                    data[0] += 50 * k
                }
            }   
        }

        this.mqtt_conn.publish(this.uid + ':pos', new Uint8Array(data.buffer))
    }
}
