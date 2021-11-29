"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTT = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
class MQTT {
    constructor(url, clients) {
        this.handlers = new Map();
        this.socket = mqtt_1.default.connect(url);
        this.clients = clients;
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
        this.on("connection", this.OnConnection.bind(this));
        this.on("ping", this.OnPing.bind(this));
    }
    AutoExecHandlers() {
        this.socket.on("message", (topic, data) => {
            const handler = this.handlers.get(topic);
            if (handler !== undefined) {
                handler(data);
            }
        });
    }
    OnConnection(data) {
        var _a;
        const uid = data.toString();
        const client = this.clients.get(uid);
        if (client !== undefined) {
            client.con = 1;
            (_a = client.web_socket) === null || _a === void 0 ? void 0 : _a.emit("info", client.con);
            this.socket.publish(uid + ":c", "1");
            const ping = setInterval(() => {
                var _a;
                if (client._pinged) {
                    this.socket.publish(uid + ":ping", "");
                    client._pinged = false;
                    return;
                }
                if (!client._pinged) {
                    client.con = 0;
                    (_a = client.web_socket) === null || _a === void 0 ? void 0 : _a.emit("info", client.con);
                    client._pinged = true;
                    clearInterval(ping);
                }
            }, 5000);
            return;
        }
        this.socket.publish(uid, "0");
    }
    OnPing(data) {
        const uid = data.toString();
        const client = this.clients.get(uid);
        if (client !== undefined) {
            client._pinged = true;
        }
    }
}
exports.MQTT = MQTT;
