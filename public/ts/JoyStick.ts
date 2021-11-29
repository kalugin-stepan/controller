/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="./declare/joy.d.ts"/>
declare const socket: Socket;
type bool = 1 | 0;

function GetCookie(cname : string) : string {
    const name : string = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

class App {
    private socket: Socket;
    readonly joy: Joy;
    readonly uid: string;
    private lastpos: string = "";
    constructor(joy_selector: string, socket: Socket = io.connect()) {
        this.socket = socket;
        this.uid = GetCookie("uid");
        this.joy = new Joy(joy_selector);
        this.events();
    }
    private events(): void {
        this.socket.on("connect", () => {
            if (this.uid !== "") {
                this.socket.emit("info", this.uid);
            }
        });
        this.socket.on("info", (data: bool) => {
            const h2 = $('h2[name="con"]');
            if (data === 1) {
                h2.text("Connected");
                h2.removeClass("disconnected");
                h2.addClass("connected");
            }
            else if (data === 0) {
                h2.text("Disconnected");
                h2.removeClass("connected");
                h2.addClass("disconnected");
            }
        });
    }
    SendPos(): void {
        const pos = JSON.stringify(this.joy.GetPos());
        if (pos !== this.lastpos) {
            this.socket.emit("pos", pos);
            this.lastpos = pos;
        }
    }
}