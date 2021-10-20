"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sender = void 0;
const nodemailer_1 = require("nodemailer");
class Sender {
    constructor(email, password) {
        this.email = email;
        this.sender = (0, nodemailer_1.createTransport)({
            service: "gmail",
            auth: {
                user: email,
                pass: password
            }
        });
    }
    send(email, subject, text) {
        this.sender.sendMail({
            from: this.email,
            to: email,
            subject: subject,
            text: text
        });
    }
}
exports.Sender = Sender;
;
