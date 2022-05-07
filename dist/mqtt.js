"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const mqtt_1 = __importDefault(require("mqtt"));
class MQTT {
    socket;
    handlers = new Map();
    constructor(url) {
        this.socket = mqtt_1.default.connect(url);
        this.AutoExecHandlers();
        this.SetHandlers();
    }
    emit(topic, data) {
        this.socket.publish(topic, data);
    }
    on(topic, handler) {
        this.socket.subscribe(topic);
        this.handlers.set(topic, handler);
    }
    SetHandlers() {
        this.on('connection', this.OnConnection.bind(this));
        this.on('ping', this.OnPing.bind(this));
    }
    AutoExecHandlers() {
        this.socket.on('message', (topic, data) => {
            const handler = this.handlers.get(topic);
            if (handler !== undefined) {
                handler(data);
            }
        });
    }
    OnConnection(data) {
        const uid = data.toString();
        const client = (0, index_1.get_client_by_field_value)('uid', uid);
        if (client !== undefined) {
            const uid = client.uid;
            client.con = 1;
            client.web_socket?.emit('info', client.con);
            this.socket.publish(uid + ':conn', '1');
            const ping = setInterval(() => {
                if (client._pinged) {
                    this.socket.publish(uid + ':ping', '');
                    client._pinged = false;
                    return;
                }
                if (!client._pinged) {
                    client.con = 0;
                    client.web_socket?.emit('info', client.con);
                    client._pinged = true;
                    clearInterval(ping);
                }
            }, 5000);
            return;
        }
        this.socket.publish(uid + ':conn', '0');
    }
    OnPing(data) {
        const uid = data.toString();
        const client = (0, index_1.get_client_by_field_value)('uid', uid);
        if (client !== undefined) {
            client._pinged = true;
        }
    }
}
exports.default = MQTT;
