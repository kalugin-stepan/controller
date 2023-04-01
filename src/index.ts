import express, { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { createServer } from 'http'
import md5 from 'md5'
import cookieParser from 'cookie-parser'
import { v4 } from 'uuid'
import IDataBase, { User } from './database'
import { SQLite_DataBase } from './sqlite_database'
import MySQL_DataBase from './mysql_database'
import WebApi from './web_api'
import { Sender } from './sender'


const app = express()
const server = createServer(app)

const uuid = v4

const root : string = path.dirname(__dirname)

const config = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf-8'))

const database: IDataBase = config.mysql.host !== null ? new MySQL_DataBase(config.mysql) : new SQLite_DataBase('db.sqlite')

const web_api: WebApi | null = config.api_url !== null ? new WebApi(config.api_url) : null

const sender: Sender | null = config.email_sender.auth.user !== null ? new Sender(config.email_sender) : null

const cam_server_url = config.cam_server_host !== null ? `${config.cam_server_scheme}://${config.cam_server_host}:${config.cam_server_http_port}` : null

function get_robot_code(uid: string, ssid: string, password: string): Buffer {
    const template = fs.readFileSync(path.join(root, 'robot_template.ino'), 'utf-8')
    const zip = new AdmZip()
    const data = Buffer.from(template
        .replace('{wifi}', ssid)
        .replace('{password}', password)
        .replace('{uid}', uid)
        .replace('{host}', config.mqtt_host)
        .replace('{port}', config.mqtt_port)
    )
    zip.addFile('robot_code/robot_code.ino', data)
    return zip.toBuffer()
}

function get_cam_code(uid: string, ssid: string, password: string) : Buffer {
    const template = fs.readFileSync(path.join(root, 'cam_template.ino'), 'utf-8')
    const zip = new AdmZip()
    const data = Buffer.from(template
        .replace('{wifi}', ssid)
        .replace('{password}', password)
        .replace('{uid}', uid)
        .replace('{host}', config.cam_server_host)
        .replace('{port}', config.cam_server_port)
    )
    zip.addFile('cam_code/cam_code.ino', data)
    return zip.toBuffer()
}

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(express.static(root))

app.use(cookieParser())

function is_password_valid(password: string): boolean {
    return password.length >= 8
}

async function is_loged_in(req: Request): Promise<boolean> {
    const id : number = parseInt(req.cookies.id)
    const password : string = req.cookies.password
    const uid : string = req.cookies.uid
    if (id && password && uid) {
        const user = await database.get_user_by_ID(id)
        if (user !== null) {
            return user.password === password && user.uid === uid && user.active === 1
        }
    }
    return false
}

async function register(username: string, email: string, password: string): Promise<boolean> {
    username = username.toLocaleLowerCase()
    if (is_password_valid(password)) {
        const password_md5 : string = md5(password).toString()
        const code : string = uuid()
        const uid : string = uuid()
        if (!await database.email_exists(email) && !await database.login_exists(username)) {
            const is_registered_in_web_api = web_api !== null ? await web_api.register(username, password) : true
            if (!is_registered_in_web_api) return false
            await database.add_usr(username, password_md5, email, uid, code)
            if (sender === null) {
                await database.active(code, uuid())
            }
            else {
                sender.send(email, 'activate', config.port === 80 ? `http://${config.host}/active/${code}` : `http://${config.host}:${config.port}/active/${code}`)
            }
            return true
        }
        return false
    }
    return false
}

async function login(username: string, password: string, res: Response): Promise<boolean | string> {
    username = username.toLowerCase()
    if (is_password_valid(password)) {
        const password_md5 : string = md5(password).toString()
        const user : User | null = await database.get_user_by_login(username)
        if (user !== null) {
            if (user.password === password_md5 && user.active === 1) {
                if (web_api !== null) {
                    const token = await web_api.login(username, password)
                    if (token === null) return false
                    res.cookie('id', user.id)
                    res.cookie('password', password_md5)
                    res.cookie('uid', user.uid)
                    res.cookie('token', token)
                    return token
                }
                res.cookie('id', user.id)
                res.cookie('password', password_md5)
                res.cookie('uid', user.uid)
                return true
            }
        }
    }
    return false
}

app.get('/', async (req, res) => {
    if (await is_loged_in(req)) {
        res.render('index.ejs', {mqtt_url: `ws://${config.mqtt_host}:${config.web_socket_mqtt_port}/mqtt`, cam_server_url})
        return
    }
    res.redirect('/login')
})

app.get('/robot_code.zip', (req, res) => {
    if (typeof req.query.wifi !== 'string' || typeof req.query.password !== 'string' || typeof req.cookies.uid !== 'string') {
        res.writeHead(404)
        res.end()
        return
    }
    res.send(get_robot_code(req.cookies.uid, req.query.wifi, req.query.password))
})

app.get('/cam_code.zip', (req, res) => {
    if (typeof req.query.wifi !== 'string' || typeof req.query.password !== 'string' || typeof req.cookies.uid !== 'string' || config.cam_server_host === null) {
        res.writeHead(404)
        res.end()
        return
    }
    res.send(get_cam_code(req.cookies.uid, req.query.wifi, req.query.password))
})

app.get('/profile', async (req, res) => {
    if (await is_loged_in(req)) {
        res.render('profile.ejs', {has_cam_server: cam_server_url !== null})
        return
    }
    res.redirect('/login')
})

app.get('/login', async (req, res) => {
    const username = req.query.username
    const password = req.query.passowrd
    if (
        typeof username === 'string'
        &&
        typeof password === 'string'
    ) {
        if (!(await login(username, password, res))) {
            res.redirect('/')
            return
        }
    }
    res.render('login.ejs')
})

app.post('/login', async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    if (
        typeof username === 'string'
        &&
        typeof password === 'string'
        &&
        await login(username, password, res)
    ) {
        res.redirect('/')
        return
    }
    res.redirect('/login')
})

app.get('/logout', (req, res) => {
    res.clearCookie('id')
    res.clearCookie('password')
    res.clearCookie('uid')
    res.clearCookie('token')
    res.redirect('/login')
})

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.post('/register', async (req, res) => {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    if (
        typeof username === 'string'
        &&
        typeof email === 'string'
        &&
        typeof password === 'string'
        &&
        await register(username, email, password)
    ) {
        res.redirect('/login')
        return
    }
    res.send('<a href="/register">login или email уже существует</a>')
})

app.get('/forgot_password', (req, res) => {
    if (sender === null) {
        res.send('Эта функция недоступна в локальном режиме')
        return
    }
    res.render('forgot_password.ejs')
})

app.post('/forgot_password', async (req, res) => {
    if (sender === null) {
        res.send('Эта функция недоступна в локальном режиме')
        return
    }
    const login : string = req.body.login.toLowerCase()
    const email : string = req.body.email.toLowerCase()
    if (login && email) {
        const user : User | null = await database.get_user_by_login(login)
        if (user !== null) {
            if (user.email === email) {
                const code = uuid()
                database.change_code_by_ID(user.id, code)
                sender.send(email, 'Смена пароля', 'http://' + config.host + ':' + config.port + '/change_password/' + code)
                res.send('На вашу почту отправлена ссылка со сменой пароля')
            }
        }
        else {
            res.send('<a href="/login">Пользователь с таким логином или email-ом не найден</a>')
        }
    }
    else {
        res.redirect('/forgot_password')
    }
})

app.get('/change_password/:code', async (req, res) => {
    const code_ex : boolean = await database.code_exists(req.params.code)
    if (code_ex) {
        res.render('change_password.ejs')
        return
    }
    res.redirect('/login')
})

app.post('/change_password/:code', async (req, res) => {
    const password_md5 : string = md5(req.body.password).toString()
    const code : string = req.params.code
    const code_ex : boolean = await database.code_exists(code)
    if (code_ex) {
        database.change_password_by_code(password_md5, code, uuid())
        res.send('<a href="/login">Пароль сменён</a>')
        return
    }
    res.redirect('/login')
})

app.get('/active/:code', async (req, res) => {
    await database.active(req.params.code, uuid())
    res.redirect('/login')
})

server.listen(config.port)