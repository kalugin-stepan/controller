"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const axios_config = { validateStatus: () => true };
class WebApi {
    url;
    constructor(url) {
        this.url = url;
    }
    async register(username, password) {
        const res = await axios_1.default.post(`${this.url}/api/register`, new URLSearchParams({ username, password }), axios_config);
        return res.status === 200;
    }
    async login(username, password) {
        const res = await axios_1.default.post(`${this.url}/api/login`, new URLSearchParams({ username, password }), axios_config);
        if (res.status !== 200)
            return null;
        return res.data;
    }
}
exports.default = WebApi;
