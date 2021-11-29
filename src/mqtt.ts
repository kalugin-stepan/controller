import { Client } from "./index"
import mqtt from "mqtt"

class MQTT {
    private readonly socket: mqtt.Client
    private readonly clients: Map<string, Client>
    private readonly handlers: Map<string, (data: Buffer) => void> = new Map();
    constructor(url: string, clients: Map<string, Client>) {
        this.socket = mqtt.connect(url)
        this.clients = clients
        this.AutoExecHandlers()
        this.SetHandlers()
    }
    emit(topic: string, data: string | Buffer): void {
        this.socket.publish(topic, data)
    }
    private on(topic: string, handler: (data: Buffer) => void): void {
        this.socket.subscribe(topic)
        this.handlers.set(topic, handler)
    }
    private SetHandlers(): void {
        this.on("connection", this.OnConnection.bind(this))
        this.on("ping", this.OnPing.bind(this))
    }
    private AutoExecHandlers(): void {
        this.socket.on("message", (topic, data) => {
            const handler = this.handlers.get(topic)
            if (handler !== undefined) {
                handler(data)
            }
        })
    }
    private OnConnection(data: Buffer): void {
        const uid = data.toString()
        const client = this.clients.get(uid)
        if (client !== undefined) {
            client.con = 1
            client.web_socket?.emit("info", client.con)
            this.socket.publish(uid+":c", "1")
            const ping = setInterval(() => {
                if (client._pinged) {
                    this.socket.publish(uid+":ping", "")
                    client._pinged = false
                    return
                }
                if (!client._pinged) {
                    client.con = 0
                    client.web_socket?.emit("info", client.con)
                    client._pinged = true
                    clearInterval(ping)
                }
            }, 5000)
            return
        }
        this.socket.publish(uid, "0")
    }
    private OnPing(data: Buffer): void {
        const uid = data.toString()
        const client = this.clients.get(uid)
        if (client !== undefined) {
            client._pinged = true;
        }
    }
}

export {MQTT}