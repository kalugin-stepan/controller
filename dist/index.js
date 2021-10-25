"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const net_1 = __importDefault(require("net"));
const app = (0, express_1.default)();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const md5_1 = __importDefault(require("md5"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const sender_1 = require("./sender");
const database_1 = require("./database");
const os_1 = __importDefault(require("os"));
const { v4: uuid } = require("uuid");
const root = path_1.default.dirname(__dirname);
const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, "config.json"), "utf-8"));
config.host = os_1.default.hostname();
const mysql_config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, "mysql_config.json"), "utf-8"));
const clients = new Map();
const rooms = new Map();
const sender = new sender_1.Sender(config.email, config.password);
const database = new database_1.DataBase(mysql_config);
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static(root));
app.use((0, cookie_parser_1.default)());
database.getUsers().then((users) => {
    users.forEach((user) => {
        clients.set(user.uid, { con: 0, login: user.login, uid: user.uid, socket: null, web_socket: null });
    });
    server.listen(config.port);
});
function is_loged_in(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = parseInt(req.cookies.id);
        const login = req.cookies.login;
        const email = req.cookies.email;
        const password = req.cookies.password;
        const uid = req.cookies.uid;
        if (id && login && email && password && uid) {
            const user = yield database.getUserByID(id);
            if (user !== null) {
                return login === user.login && email === user.email && user.password === password && user.uid === uid && user.active === 1;
            }
        }
        return false;
    });
}
function login(req, res) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof req.body.login === "string" && typeof req.body.password === "string" || typeof req.query.login === "string" && typeof req.query.password === "string") {
            const login = req.body.login ? req.body.login.toLowerCase() : (_a = req.query.login) === null || _a === void 0 ? void 0 : _a.toString().toLowerCase();
            const password = req.body.password ? req.body.password : (_b = req.query.password) === null || _b === void 0 ? void 0 : _b.toString();
            const password_md5 = (0, md5_1.default)(password).toString();
            if (password.length >= 8) {
                const user = yield database.getUserByLogin(login);
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
    });
}
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield is_loged_in(req)) {
        res.render("index.ejs", { host: config.host, port: config.port, peer_port: config.peer_port });
        return;
    }
    res.redirect("/login");
}));
app.get("/script", (req, res) => {
    let template = fs_1.default.readFileSync(path_1.default.join(root, "ino", "template.ino")).toString("utf-8");
    template = template.replace("{wifi}", req.query.wifi);
    template = template.replace("{password}", req.query.password);
    template = template.replace("{uid}", req.cookies.uid);
    template = template.replace("{host}", config.host);
    template = template.replace("{port}", config.socket_port);
    fs_1.default.writeFileSync(path_1.default.join(root, "ino", "script", "script", "script.ino"), template);
    const zip = new adm_zip_1.default();
    zip.addLocalFolder(path_1.default.join(root, "ino", "script"));
    zip.writeZip(path_1.default.join(root, "script.zip"));
    res.sendFile(path_1.default.join(root, "script.zip"));
});
app.get("/profile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield is_loged_in(req)) {
        res.render("profile.ejs");
        return;
    }
    res.redirect("/login");
}));
app.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield is_loged_in(req)) {
        const keys = clients.keys();
        const info = [];
        for (const key of keys) {
            const user = clients.get(key);
            if (user.con === 1) {
                info.push(user.login);
            }
        }
        res.render("users.ejs", { users: info });
        return;
    }
    res.redirect("/login");
}));
app.get("/get_users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield is_loged_in(req)) {
        const keys = clients.keys();
        const info = [];
        for (const key of keys) {
            const user = clients.get(key);
            if (user.con === 1) {
                info.push(user.login);
            }
        }
        res.send(JSON.stringify(info));
        return;
    }
    res.redirect("/login");
}));
app.get("/videos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield is_loged_in(req)) {
        res.render("videos.ejs", { host: config.host, port: config.port, peer_port: config.peer_port });
        return;
    }
    res.redirect("/login");
}));
app.get("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield login(req, res)) {
        res.redirect("/");
        return;
    }
    res.render("login.ejs");
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield login(req, res)) {
        res.redirect("/");
        return;
    }
    res.redirect("/login");
}));
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
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const login = req.body.login.toLowerCase();
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = uuid();
    const uid = uuid();
    if (password.length >= 8) {
        if (!(yield database.email_exists(email)) && !(yield database.login_exists(login))) {
            sender.send(email, "Active", "http://" + config.host + ":" + config.port + "/active/" + code);
            database.add_usr(login, password_md5, email, uid, code);
            clients.set(uid, { con: 0, login: login, uid: uid, socket: null, web_socket: null });
            res.send("На вашу почту пришло сообщение с активацией аккаунта.");
        }
        else {
            res.send('<a href="/register">login или email уже существует</a>');
        }
    }
    else {
        res.redirect("/login");
    }
}));
app.get("/forgot_password", (req, res) => {
    res.render("forgot_password.ejs");
});
app.post("/forgot_password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const login = req.body.login.toLowerCase();
    const email = req.body.email.toLowerCase();
    if (login && email) {
        const user = yield database.getUserByLogin(login);
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
}));
app.get("/change_password/:code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code_ex = yield database.code_exists(req.params.code);
    if (code_ex) {
        res.render("change_password.ejs");
        return;
    }
    res.redirect("/login");
}));
app.post("/change_password/:code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = req.params.code;
    const code_ex = yield database.code_exists(code);
    if (code_ex) {
        database.changePasswordByCode(password_md5, code, uuid());
        res.send('<a href="/login">Пароль сменён</a>');
        return;
    }
    res.redirect("/login");
}));
app.get("/active/:code", (req, res) => {
    database.active(req.params.code, uuid());
    res.redirect("/login");
});
const socket_server = net_1.default.createServer(socket => {
    socket.setTimeout(100);
    let client;
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
            return;
        }
        socket.write("0\n");
    });
    const on_close = (client) => {
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
        if (client !== undefined && client.socket !== null) {
            client.socket.write(data + "\n");
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
