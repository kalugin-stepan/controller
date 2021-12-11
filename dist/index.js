"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const http_1 = require("http");
const server = (0, http_1.createServer)(app);
const io = require('socket.io')(server);
const md5_1 = __importDefault(require("md5"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const { v4: uuid } = require("uuid");
const sender_1 = require("./sender");
const database_1 = require("./database");
const mqtt_1 = require("./mqtt");
const root = path_1.default.dirname(__dirname);
const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, "config.json"), "utf-8"));
const clients = new Map();
const rooms = new Map();
const database = new database_1.DataBase("db.sqlite");
const sender = new sender_1.Sender(config.email, config.password);
const mqtt = new mqtt_1.MQTT(`${config.mqtt_host}:${config.mqtt_port}`, clients);
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static(root));
app.use((0, cookie_parser_1.default)());
database.getUsers().then((users) => {
    users.forEach((user) => {
        clients.set(user.uid, { con: 0, login: user.login, uid: user.uid, web_socket: null, _pinged: true });
    });
});
async function is_loged_in(req) {
    const id = parseInt(req.cookies.id);
    const login = req.cookies.login;
    const email = req.cookies.email;
    const password = req.cookies.password;
    const uid = req.cookies.uid;
    if (id && login && email && password && uid) {
        const user = await database.getUserByID(id);
        if (user !== null) {
            return login === user.login && email === user.email && user.password === password && user.uid === uid && user.active === 1;
        }
    }
    return false;
}
async function login(req, res) {
    if (typeof req.body.login === "string" && typeof req.body.password === "string" || typeof req.query.login === "string" && typeof req.query.password === "string") {
        const login = req.body.login ? req.body.login.toLowerCase() : req.query.login?.toString().toLowerCase();
        const password = req.body.password ? req.body.password : req.query.password?.toString();
        const password_md5 = (0, md5_1.default)(password).toString();
        if (password.length >= 8) {
            const user = await database.getUserByLogin(login);
            if (user !== null) {
                if (user.password === password_md5 && user.active === 1) {
                    res.cookie("id", user.id);
                    res.cookie("login", user.login);
                    res.cookie("password", user.password);
                    res.cookie("email", user.email);
                    res.cookie("uid", user.uid);
                    return true;
                }
            }
        }
    }
    return false;
}
app.get("/", async (req, res) => {
    if (await is_loged_in(req)) {
        res.render("index.ejs");
        return;
    }
    res.redirect("/login");
});
app.get("/script", (req, res) => {
    if (typeof req.query.wifi !== "string" || typeof req.query.password !== "string" || typeof req.cookies.uid !== "string") {
        res.redirect("/");
        return;
    }
    let template = fs_1.default.readFileSync(path_1.default.join(root, "ino", "template.ino"), "utf-8");
    template = template.replace("{wifi}", req.query.wifi);
    template = template.replace("{password}", req.query.password);
    template = template.replaceAll("{uid}", req.cookies.uid);
    template = template.replace("{host}", config.mqtt_host);
    template = template.replace("{port}", config.mqtt_port);
    fs_1.default.writeFileSync(path_1.default.join(root, "ino", "script", "script", "script.ino"), template);
    const zip = new adm_zip_1.default();
    zip.addLocalFolder(path_1.default.join(root, "ino", "script"));
    zip.writeZip(path_1.default.join(root, "script.zip"));
    res.sendFile(path_1.default.join(root, "script.zip"));
});
app.get("/profile", async (req, res) => {
    if (await is_loged_in(req)) {
        res.render("profile.ejs");
        return;
    }
    res.redirect("/login");
});
app.get("/users", async (req, res) => {
    if (await is_loged_in(req)) {
        const vals = clients.values();
        const info = [];
        for (const val of vals) {
            if (val.con === 1) {
                info.push(val.login);
            }
        }
        console.log(info);
        res.render("users.ejs", { users: info });
        return;
    }
    res.redirect("/login");
});
app.get("/get_users", async (req, res) => {
    if (await is_loged_in(req)) {
        const keys = clients.keys();
        const info = [];
        for (const key of keys) {
            const user = clients.get(key);
            if (user.con === 1) {
                info.push(user.login);
            }
        }
        res.send(JSON.stringify({ "info": info }));
        return;
    }
    res.redirect("/login");
});
app.get("/videos", async (req, res) => {
    if (await is_loged_in(req)) {
        res.render("videos.ejs");
        return;
    }
    res.redirect("/login");
});
app.get("/login", async (req, res) => {
    if (await login(req, res)) {
        res.redirect("/");
        return;
    }
    res.render("login.ejs");
});
app.post("/login", async (req, res) => {
    if (await login(req, res)) {
        res.redirect("/");
        return;
    }
    res.redirect("/login");
});
app.get("/logout", (req, res) => {
    res.clearCookie("id");
    res.clearCookie("login");
    res.clearCookie("password");
    res.clearCookie("email");
    res.clearCookie("login");
    res.clearCookie("uid");
    res.render("logout.ejs");
});
app.get("/register", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.render("register.ejs");
});
app.post("/register", async (req, res) => {
    const login = req.body.login.toLowerCase();
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = uuid();
    const uid = uuid();
    if (password.length >= 8) {
        if (!await database.email_exists(email) && !await database.login_exists(login)) {
            sender.send(email, "Active", "http://" + config.host + ":" + config.port + "/active/" + code);
            database.add_usr(login, password_md5, email, uid, code);
            clients.set(uid, { con: 0, login: login, uid: uid, web_socket: null, _pinged: true });
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
app.get("/forgot_password", (req, res) => {
    res.render("forgot_password.ejs");
});
app.post("/forgot_password", async (req, res) => {
    const login = req.body.login.toLowerCase();
    const email = req.body.email.toLowerCase();
    if (login && email) {
        const user = await database.getUserByLogin(login);
        if (user !== null) {
            if (user.email === email) {
                const code = uuid();
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
app.get("/change_password/:code", async (req, res) => {
    const code_ex = await database.code_exists(req.params.code);
    if (code_ex) {
        res.render("change_password.ejs");
        return;
    }
    res.redirect("/login");
});
app.post("/change_password/:code", async (req, res) => {
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = req.params.code;
    const code_ex = await database.code_exists(code);
    if (code_ex) {
        database.changePasswordByCode(password_md5, code, uuid());
        res.send('<a href="/login">Пароль сменён</a>');
        return;
    }
    res.redirect("/login");
});
app.get("/active/:code", (req, res) => {
    database.active(req.params.code, uuid());
    res.redirect("/login");
});
io.on("connection", (socket) => {
    let client;
    socket.on("info", (data) => {
        const c = clients.get(data);
        if (c !== undefined) {
            client = c;
            client.web_socket = socket;
            socket.emit("info", client.con);
        }
    });
    socket.on("pos", (data) => {
        if (client !== undefined && client.con === 1) {
            mqtt.emit(client.uid + ":pos", data);
        }
    });
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
    let peer_id = "";
    let room_id = "";
    let room;
    socket.on("join", (p_id, r_id) => {
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
server.listen(config.port);
