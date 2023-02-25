import {createTransport, Transporter, SentMessageInfo} from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

export class Sender {
    sender : Transporter<SentMessageInfo>
    constructor(options: SMTPTransport.Options) {
        this.sender = createTransport(options, {from: options.from})
    }
    send(email : string, subject : string, text : string) : void {
        this.sender.sendMail({
            to : email,
            subject : subject,
            text : text
        })
    }
}

export { SMTPTransport }