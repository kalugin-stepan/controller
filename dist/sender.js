"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMTPTransport = exports.Sender = void 0;
const nodemailer_1 = require("nodemailer");
const smtp_transport_1 = __importDefault(require("nodemailer/lib/smtp-transport"));
exports.SMTPTransport = smtp_transport_1.default;
class Sender {
    sender;
    constructor(options) {
        this.sender = (0, nodemailer_1.createTransport)(options, { from: options.from });
    }
    send(email, subject, text) {
        this.sender.sendMail({
            to: email,
            subject: subject,
            text: text
        });
    }
}
exports.Sender = Sender;
