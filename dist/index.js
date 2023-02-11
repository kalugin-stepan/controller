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
const uuid_1 = require("uuid");
const database_1 = require("./database");
const web_api_1 = __importDefault(require("./web_api"));
const sender_1 = require("./sender");
const uuid = uuid_1.v4;
const root = path_1.default.dirname(__dirname);
const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(root, 'config.json'), 'utf-8'));
const database = new database_1.DataBase('db.sqlite');
const web_api = config.api_url !== null ? new web_api_1.default(config.api_url) : null;
const sender = config.email !== null ? new sender_1.Sender(config.email, config.password) : null;
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
function is_password_valid(password) {
    return password.length >= 8;
}
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
async function register(username, email, password) {
    username = username.toLocaleLowerCase();
    if (is_password_valid(password)) {
        const password_md5 = (0, md5_1.default)(password).toString();
        const code = uuid();
        const uid = uuid();
        if (!await database.emailExists(email) && !await database.loginExists(username)) {
            const is_registered_in_web_api = web_api !== null ? await web_api.register(username, password) : true;
            if (!is_registered_in_web_api)
                return false;
            await database.addUsr(username, password_md5, email, uid, code);
            if (sender === null) {
                await database.active(code, uuid());
            }
            else {
                sender.send(email, 'activate', `http://${config.host}:${config.port}/active/${code}`);
            }
            return true;
        }
        return false;
    }
    return false;
}
async function login(username, password, res) {
    username = username.toLowerCase();
    if (is_password_valid(password)) {
        const password_md5 = (0, md5_1.default)(password).toString();
        const user = await database.getUserByLogin(username);
        if (user !== null) {
            if (user.password === password_md5 && user.active === 1) {
                if (web_api !== null) {
                    const token = await web_api.login(username, password);
                    if (token === null)
                        return false;
                    res.cookie('id', user.id);
                    res.cookie('password', password_md5);
                    res.cookie('uid', user.uid);
                    res.cookie('token', token);
                    return token;
                }
                res.cookie('id', user.id);
                res.cookie('password', password_md5);
                res.cookie('uid', user.uid);
                return true;
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
    const username = req.query.username;
    const password = req.query.passowrd;
    if (typeof username === 'string'
        &&
            typeof password === 'string') {
        if (!(await login(username, password, res))) {
            res.redirect('/');
            return;
        }
    }
    res.render('login.ejs');
});
app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (typeof username === 'string'
        &&
            typeof password === 'string'
        &&
            await login(username, password, res)) {
        res.redirect('/');
        return;
    }
    res.redirect('/login');
});
app.get('/logout', (req, res) => {
    res.clearCookie('id');
    res.clearCookie('password');
    res.clearCookie('uid');
    res.clearCookie('token');
    res.redirect('/login');
});
app.get('/register', (req, res) => {
    res.render('register.ejs');
});
app.post('/register', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (typeof username === 'string'
        &&
            typeof email === 'string'
        &&
            typeof password === 'string'
        &&
            await register(username, email, password)) {
        res.redirect('/login');
        return;
    }
    res.send('<a href="/register">login или email уже существует</a>');
});
app.get('/forgot_password', (req, res) => {
    if (sender === null) {
        res.send('Эта функция недоступна в локальном режиме');
        return;
    }
    res.render('forgot_password.ejs');
});
app.post('/forgot_password', async (req, res) => {
    if (sender === null) {
        res.send('Эта функция недоступна в локальном режиме');
        return;
    }
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
    const code_ex = await database.codeExists(req.params.code);
    if (code_ex) {
        res.render('change_password.ejs');
        return;
    }
    res.redirect('/login');
});
app.post('/change_password/:code', async (req, res) => {
    const password_md5 = (0, md5_1.default)(req.body.password).toString();
    const code = req.params.code;
    const code_ex = await database.codeExists(code);
    if (code_ex) {
        database.changePasswordByCode(password_md5, code, uuid());
        res.send('<a href="/login">Пароль сменён</a>');
        return;
    }
    res.redirect('/login');
});
app.get('/active/:code', async (req, res) => {
    await database.active(req.params.code, uuid());
    res.redirect('/login');
});
server.listen(config.port);
