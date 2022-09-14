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
const md5_1 = __importDefault(require("md5"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const { v4: uuid } = require('uuid');
const sender_1 = require("./sender");
const database_1 = require("./database");
const root = path_1.default.dirname(__dirname);
const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, 'config.json'), 'utf-8'));
const database = new database_1.DataBase('db.sqlite');
const sender = new sender_1.Sender(config.email, config.password);
const templ = fs_1.default.readFileSync(path_1.default.join(root, 'template.ino'), 'utf-8');
function get_zip(uid, ssid, password) {
    const zip = new adm_zip_1.default();
    const data = Buffer.from(templ.replace('{wifi}', ssid)
        .replace('{password}', password)
        .replaceAll('{uid}', uid)
        .replace('{host}', config.mqtt_host)
        .replace('{port}', config.mqtt_port));
    zip.addFile('script/script.ino', data);
    return zip.toBuffer();
}
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static(root));
app.use((0, cookie_parser_1.default)());
async function is_loged_in(req) {
    const id = parseInt(req.cookies.id);
    const password = req.cookies.password;
    const uid = req.cookies.uid;
    if (id && password && uid) {
        const user = await database.getUserByID(id);
        if (user !== null) {
            return user.password === password && user.uid === uid && user.active === 1;
        }
    }
    return false;
}
async function login(req, res) {
    if (typeof req.body.login === 'string' && typeof req.body.password === 'string' || typeof req.query.login === 'string' && typeof req.query.password === 'string') {
        const login = req.body.login ? req.body.login.toLowerCase() : req.query.login?.toString().toLowerCase();
        const password = req.body.password ? req.body.password : req.query.password?.toString();
        const password_md5 = (0, md5_1.default)(password).toString();
        if (password.length >= 8) {
            const user = await database.getUserByLogin(login);
            if (user !== null) {
                if (user.password === password_md5 && user.active === 1) {
                    res.cookie('id', user.id);
                    res.cookie('password', user.password);
                    res.cookie('uid', user.uid);
                    return true;
                }
            }
        }
    }
    return false;
}
app.get('/', async (req, res) => {
    if (await is_loged_in(req)) {
        res.render('index.ejs', { mqtt_url: `ws://${config.mqtt_host}:${config.mqtt_port}/mqtt` });
        return;
    }
    res.redirect('/login');
});
app.get('/script.zip', (req, res) => {
    if (typeof req.query.wifi !== 'string' || typeof req.query.password !== 'string' || typeof req.cookies.uid !== 'string') {
        res.redirect('/');
        return;
    }
    res.send(get_zip(req.cookies.uid, req.query.wifi, req.query.password));
});
app.get('/profile', async (req, res) => {
    if (await is_loged_in(req)) {
        res.render('profile.ejs');
        return;
    }
    res.redirect('/login');
});
app.get('/login', async (req, res) => {
    if (await login(req, res)) {
        res.redirect('/');
        return;
    }
    res.render('login.ejs');
});
app.post('/login', async (req, res) => {
    if (await login(req, res)) {
        res.redirect('/');
        return;
    }
    res.redirect('/login');
});
app.get('/logout', (req, res) => {
    res.clearCookie('id');
    res.clearCookie('password');
    res.clearCookie('uid');
    res.redirect('/login');
});
app.get('/register', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.render('register.ejs');
});
app.post('/register', async (req, res) => {
    const login = req.body.login.toLowerCase();
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = uuid();
    const uid = uuid();
    if (password.length >= 8) {
        if (!await database.email_exists(email) && !await database.login_exists(login)) {
            sender.send(email, 'Active', 'http://' + config.host + ':' + config.port + '/active/' + code);
            database.add_usr(login, password_md5, email, uid, code);
            res.send('На вашу почту пришло сообщение с активацией аккаунта.');
        }
        else {
            res.send('<a href="/register">login или email уже существует</a>');
        }
    }
    else {
        res.redirect('/login');
    }
});
app.get('/forgot_password', (req, res) => {
    res.render('forgot_password.ejs');
});
app.post('/forgot_password', async (req, res) => {
    const login = req.body.login.toLowerCase();
    const email = req.body.email.toLowerCase();
    if (login && email) {
        const user = await database.getUserByLogin(login);
        if (user !== null) {
            if (user.email === email) {
                const code = uuid();
                database.changeCodeById(user.id, code);
                sender.send(email, 'Смена пароля', 'http://' + config.host + ':' + config.port + '/change_password/' + code);
                res.send('На вашу почту отправлена ссылка со сменой пароля');
            }
        }
        else {
            res.send('<a href="/login">Пользователь с таким логином или email-ом не найден</a>');
        }
    }
    else {
        res.redirect('/forgot_password');
    }
});
app.get('/change_password/:code', async (req, res) => {
    const code_ex = await database.code_exists(req.params.code);
    if (code_ex) {
        res.render('change_password.ejs');
        return;
    }
    res.redirect('/login');
});
app.post('/change_password/:code', async (req, res) => {
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = req.params.code;
    const code_ex = await database.code_exists(code);
    if (code_ex) {
        database.changePasswordByCode(password_md5, code, uuid());
        res.send('<a href="/login">Пароль сменён</a>');
        return;
    }
    res.redirect('/login');
});
app.get('/active/:code', (req, res) => {
    database.active(req.params.code, uuid());
    res.redirect('/login');
});
server.listen(config.port);
