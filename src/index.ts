import express, {Request} from "express";
import net from "net";
const app = express();
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
const server = require("http").createServer(app);
import {Socket} from "socket.io";
const io = require('socket.io')(server);
import md5 from "md5";
import cookieParser from "cookie-parser";
import {Sender} from "./sender"
import {DataBase, User, bool} from "./database"
const {v4 : uuid4} = require("uuid");

interface Client {
    con : bool;
    login : string;
    uid: string;
    socket: net.Socket | null;
    web_socket: Socket | null;
}

const root : string = path.dirname(__dirname);

const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf-8"));
const mysql_config = JSON.parse(fs.readFileSync(path.join(root, "mysql_config.json"), "utf-8"));

const clients = new Map<string, Client>();

const rooms = new Map<string, string[]>();

const sender = new Sender(config.email, config.password);

const database = new DataBase(mysql_config);

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static(root));

app.use(cookieParser());

database.getUsers().then((users : Array<User>) => {

    users.forEach((user : User) => {
        clients.set(user.uid, {con : 0, login : user.login, uid: user.uid, socket: null, web_socket: null});
    });

    server.listen(config.port);

});

async function is_loged_in(req : Request) : Promise<boolean> {
    const id : number = parseInt(req.cookies.id);
    const login : string = req.cookies.login;
    const email : string = req.cookies.email;
    const password : string = req.cookies.password;
    const uid : string = req.cookies.uid;
    if (id && login && email && password && uid) {
        const user = await database.getUserByID(id);
        if (user !== null) {
            return login === user.login && email === user.email && user.password === password && user.uid === uid && user.active === 1;
        }
    }
    return false;
}

app.get("/", async (req, res): Promise<void> => {
    if (await is_loged_in(req)) {
        res.render("index.ejs", {host : config.host, port : config.port, peer_port : config.peer_port});
    }
    else {
        res.redirect("/login");
    }
});

app.get("/script", (req, res): void => {
    let template = fs.readFileSync(path.join(root, "ino", "template.ino")).toString("utf-8");
    template = template.replace("{wifi}", req.query.wifi as string);
    template = template.replace("{password}", req.query.password as string);
    template = template.replace("{uid}", req.cookies.uid);
    template = template.replace("{host}", config.host);
    template = template.replace("{port}", config.socket_port);
    fs.writeFileSync(path.join(root, "ino", "script", "script", "script.ino"), template);
    const zip = new AdmZip();
    zip.addLocalFolder(path.join(root, "ino", "script"));
    zip.writeZip(path.join(root, "script.zip"));
    res.sendFile(path.join(root, "script.zip"));
});

app.get("/profile", async (req, res): Promise<void> => {
    if (await is_loged_in(req)) {
        res.render("profile.ejs");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/users", async (req, res): Promise<void> => {
    if (await is_loged_in(req)) {
        const keys : IterableIterator<string> = clients.keys();
        const info = [];
        for (const key of keys) {
            const user : Client = clients.get(key) as Client;
            if (user.con === 1) {
                info.push(user.login);
            }
        }
        res.render("users.ejs", {users : info});
    }
    else {
        res.redirect("/login");
    }
});

app.get("/get_users", async (req, res): Promise<void> => {
    if (await is_loged_in(req)) {
        const keys : IterableIterator<string> = clients.keys();
        const info = [];
        for (const key of keys) {
            const user : Client = clients.get(key) as Client;
            if (user.con === 1) {
                info.push(user.login);
            }
        }
        res.send(JSON.stringify(info));
    }
    else {
        res.redirect("/login");
    }
});

app.get("/videos", async (req, res): Promise<void> => {
    if (await is_loged_in(req)) {
        res.render("videos.ejs", {host : config.host, port : config.port, peer_port : config.peer_port});
    }
    else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res): void => {
    res.render("login.ejs");
});

app.post("/login", async (req, res): Promise<void> => {
    const login : string = req.body.login.toLowerCase();
    const password : string = req.body.password;
    const password_md5 : string = md5(password).toString();
    if (password.length >= 8) {
        const user : User | null = await database.getUserByLogin(login);
        if (user !== null) {
            if (user.password === password_md5 && user.active === 1) {
                res.cookie("id", user.id);
                res.cookie("login", user.login);
                res.cookie("password", user.password);
                res.cookie("email", user.email);
                res.cookie("uid", user.uid);
                res.redirect("/");
            }
            else {
                res.redirect("/login");
            }
        }
        else {
            res.redirect("/login")
        }
    }
});

app.get("/logout", (req, res): void => {
    res.clearCookie("id");
    res.clearCookie("login");
    res.clearCookie("password");
    res.clearCookie("email");
    res.clearCookie("login");
    res.clearCookie("uid");
    res.render("logout.ejs");
});

app.get("/register", (req, res): void => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.render("register.ejs");
});

app.post("/register", async (req, res): Promise<void> => {
    const login : string = req.body.login.toLowerCase();
    const email : string = req.body.email.toLowerCase();
    const password : string = req.body.password;
    const password_md5 : string = md5(req.body.password).toString();
    const code : string = uuid4();
    const uid : string = uuid4();
    if (password.length >= 8) {
        if (!await database.email_exists(email) && !await database.login_exists(login)) {
            sender.send(email, "Active", "http://" + config.host + ":" + config.port + "/active/" + code);
            database.add_usr(login, password_md5, email, uid, code);
            clients.set(uid, {con : 0, login : login, uid: uid, socket: null, web_socket: null});
            res.send("На вашу почту пришло сообщение с активацией аккаунта.");
        }
        else {
            res.send('<a href="/register">login или email уже существует</a>');
        }
    }
    else {
        res.redirect("/login");
    }
});

app.get("/forgot_password", (req, res): void => {
    res.render("forgot_password.ejs");
});

app.post("/forgot_password", async (req, res): Promise<void> => {
    const login : string = req.body.login.toLowerCase();
    const email : string = req.body.email.toLowerCase();
    if (login && email) {
        const user : User | null = await database.getUserByLogin(login);
        if (user !== null) {
            if (user.email === email) {
                const code = uuid4();
                database.changeCodeById(user.id, code);
                sender.send(email, "Смена пароля", "http://" + config.host + ":" + config.port + "/change_password/" + code);
                res.send('На вашу почту отправлена ссылка со сменой пароля');
            }
        }
        else {
            res.send('<a href="/login">Пользователь с таким логином или email-ом не найден</a>');
        }
    }
    else {
        res.redirect("/forgot_password");
    }
});

app.get("/change_password/:code", async (req, res): Promise<void> => {
    const code_ex : boolean = await database.code_exists(req.params.code);
        if (code_ex) {
            res.render("change_password.ejs");
        }
        else if (!code_ex) {
            res.redirect("/login");
        }
});

app.post("/change_password/:code", async (req, res): Promise<void> => {
    const password_md5 : string = md5(req.body.password).toString();
    const code : string = req.params.code;
    const code_ex : boolean = await database.code_exists(code);
    if (code_ex) {
        database.changePasswordByCode(password_md5, code, uuid4());
        res.send('<a href="/login">Пароль сменён</a>');
    }
    else if (!code_ex) {
        res.redirect("/login");
    }
});

app.get("/active/:code", (req, res): void => {
    database.active(req.params.code, uuid4());
    res.redirect("/login");
});

const socket_server = net.createServer(socket => {
    socket.setTimeout(100);
    let client: Client;
    socket.on("data", data => {
        const id = data.toString();
        const c = clients.get(id);
        if (c !== undefined && c.socket === null) {
            client = c;
            client.con = 1;
            client.socket = socket;
            socket.write("1\n");
            if (client.web_socket !== null) {
                client.web_socket.emit("info", 1);
            }
        }
        else {
            socket.write("0\n");
        }
    });
    const on_close = (client: Client | undefined) => {
        if (client !== undefined) {
            client.con = 0;
            client.socket = null;
            if (client.web_socket !== null) {
                client.web_socket.emit("info", 0);
            }
        }
    };
    socket.on("close", () => {
        on_close(client);
    });
    socket.on("error", () => {
        on_close(client);
    });
});

socket_server.listen(config.socket_port);

io.on("connection", (socket: Socket) => {
    let client: Client;
    socket.on("info", (data: string) => {
        const c = clients.get(data);
        if (c !== undefined) {
            client = c;
            client.web_socket = socket;
            socket.emit("info", client.con);
        }
    });
    socket.on("pos", (data: string) => {
        if (client !== undefined && client.socket !== null) {
            client.socket.write(data + "\n");
        }
    })
    socket.on("disconnect", () => {
        if (client !== undefined) {
            client.web_socket = null;
        }
        if (peer_id !== "" && room !== undefined && room_id !== "") {
            const index = room.indexOf(peer_id);
            if (index > -1) {
                room.splice(index, 1);
            }
            io.emit("disconn", peer_id);
        }
    });
    let peer_id: string = "";
    let room_id: string = "";
    let room: string[] | undefined;
    socket.on("join", (p_id: string, r_id: string) => {
        peer_id = p_id;
        room_id = r_id;
        room = rooms.get(room_id);
        if (room === undefined) {
            room = [];
            rooms.set(room_id, room);
        }
        if (room !== undefined) {
            room.push(peer_id);
            socket.emit("peers", room);
        }
    });
});
