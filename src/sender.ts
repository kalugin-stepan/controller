import {createTransport, Transporter, SentMessageInfo} from "nodemailer";

export class Sender {
    email : string;
    sender : Transporter<SentMessageInfo>;
    constructor(email : string, password : string) {
        this.email = email;
        this.sender = createTransport({
            service : "gmail",
            auth : {
                user : email,
                pass : password
            }
        });
    }
    send(email : string, subject : string, text : string) : void {
        this.sender.sendMail({
            from : this.email,
            to : email,
            subject : subject,
            text : text
        })
    }
};