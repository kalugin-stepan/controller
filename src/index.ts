import express, {Request, Response} from "express"
const app = express()
import fs from "fs"
import path from "path"
import AdmZip from "adm-zip"
import { createServer } from "http"
const server = createServer(app)
import {Socket} from "socket.io"
const io = require('socket.io')(server)
import md5 from "md5"
import cookieParser from "cookie-parser"
const {v4 : uuid} = require("uuid")
import {Sender} from "./sender"
import {DataBase, User, bool} from "./database"
import { MQTT } from "./mqtt"

export {Client, get_client_by_field_value}
interface Client {
    con : bool
    login : string
    uid: string
    uid_md5: string
    web_socket: Socket | null
    _pinged: boolean
}

const root : string = path.dirname(__dirname)

const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf-8"))

const clients: Client[] = []

const rooms = new Map<string, string[]>()

const database = new DataBase("db.sqlite")

const sender = new Sender(config.email, config.password)

const mqtt = new MQTT(`mqtt://${config.mqtt_host}:${config.mqtt_port}`, clients)

const templ = fs.readFileSync(path.join(root, "template.ino"), "utf-8")

function get_client_by_field_value(field_name: keyof Client, field_value: any): Client | undefined {
    for (const client of clients) {
        if (client[field_name] === field_value) {
            return client
        }
    }
    return undefined
}

function get_zip(uid: string, ssid: string, password: string): Buffer {
    const zip = new AdmZip();
    const data = Buffer.from(templ.replace("{wifi}", ssid)
    .replace("{password}", password)
    .replaceAll("{uid}", uid)
    .replace("{host}", config.mqtt_host)
    .replace("{port}", config.mqtt_port))
    zip.addFile("script/script.ino", data)
    return zip.toBuffer()
}

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(express.static(root))

app.use(cookieParser())

database.getUsers().then((users : Array<User>) => {
    users.forEach((user : User) => {
        clients.push({con : 0, login : user.login, uid: user.uid, uid_md5: md5(user.uid).toString(), web_socket: null, _pinged: true})
    })
})

async function is_loged_in(req: Request): Promise<boolean> {
    const id : number = parseInt(req.cookies.id)
    const login : string = req.cookies.login
    const email : string = req.cookies.email
    const password : string = req.cookies.password
    const uid : string = req.cookies.uid
    if (id && login && email && password && uid) {
        const user = await database.getUserByID(id)
        if (user !== null) {
            return login === user.login && email === user.email && user.password === password && user.uid === uid && user.active === 1
        }
    }
    return false
}

async function login(req: Request, res: Response): Promise<boolean> {
    if (typeof req.body.login === "string" && typeof req.body.password === "string" || typeof req.query.login === "string" && typeof req.query.password === "string") {
        const login : string = req.body.login ? req.body.login.toLowerCase(): req.query.login?.toString().toLowerCase()
        const password : string = req.body.password ? req.body.password: req.query.password?.toString()
        const password_md5 : string = md5(password).toString()
        if (password.length >= 8) {
            const user : User | null = await database.getUserByLogin(login)
            if (user !== null) {
                if (user.password === password_md5 && user.active === 1) {
                    res.cookie("id", user.id)
                    res.cookie("login", user.login)
                    res.cookie("password", user.password)
                    res.cookie("email", user.email)
                    res.cookie("uid", user.uid)
                    return true
                }
            }
        }
    }
    return false
}

app.get("/", async (req, res) => {
    if (await is_loged_in(req)) {
        res.render("index.ejs")
        return
    }
    res.redirect("/login")
})

app.get("/script.zip", (req, res) => {
    if (typeof req.query.wifi !== "string" || typeof req.query.password !== "string" || typeof req.cookies.uid !== "string") {
        res.redirect("/")
        return
    }
    res.send(get_zip(req.cookies.uid, req.query.wifi, req.query.password))
})

app.get("/profile", async (req, res) => {
    if (await is_loged_in(req)) {
        res.render("profile.ejs")
        return
    }
    res.redirect("/login")
})

app.get("/users", async (req, res) => {
    if (await is_loged_in(req)) {
        const vals : IterableIterator<Client> = clients.values()
        const info: string[] = []
        for (const val of vals) {
            if (val.con === 1) {
                info.push(val.login)
            }
        }
        console.log(info)
        res.render("users.ejs", {users : info})
        return
    }
    res.redirect("/login")
})

app.get("/get_users", async (req, res) => {
    if (await is_loged_in(req)) {
        const info: string[] = [];
        for (const client of clients) {
            if (client.con === 1) {
                info.push(client.login)
            }
        }
        res.send(JSON.stringify({"info": info}))
        return
    }
    res.redirect("/login")
})

app.get("/videos", async (req, res) => {
    if (await is_loged_in(req)) {
        res.render("videos.ejs")
        return
    }
    res.redirect("/login")
})

app.get("/login", async (req, res) => {
    if (await login(req, res)) {
        res.redirect("/")
        return    
    }
    res.render("login.ejs")
})

app.post("/login", async (req, res) => {
    if (await login(req, res)) {
        res.redirect("/")
        return
    }
    res.redirect("/login")
})

app.get("/logout", (req, res) => {
    res.clearCookie("id")
    res.clearCookie("login")
    res.clearCookie("password")
    res.clearCookie("email")
    res.clearCookie("login")
    res.clearCookie("uid")
    res.render("logout.ejs")
})

app.get("/register", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.render("register.ejs")
})

app.post("/register", async (req, res) => {
    const login : string = req.body.login.toLowerCase()
    const email : string = req.body.email.toLowerCase()
    const password : string = req.body.password
    const password_md5 : string = md5(req.body.password).toString()
    const code : string = uuid()
    const uid : string = uuid()
    if (password.length >= 8) {
        if (!await database.email_exists(email) && !await database.login_exists(login)) {
            sender.send(email, "Active", "http://" + config.host + ":" + config.port + "/active/" + code)
            database.add_usr(login, password_md5, email, uid, code)
            clients.push({con : 0, login : login, uid: uid, uid_md5: md5(uid).toString(), web_socket: null, _pinged: true})
            res.send("На вашу почту пришло сообщение с активацией аккаунта.")
        }
        else {
            res.send('<a href="/register">login или email уже существует</a>')
        }
    }
    else {
        res.redirect("/login")
    }
})

app.get("/forgot_password", (req, res) => {
    res.render("forgot_password.ejs")
})

app.post("/forgot_password", async (req, res) => {
    const login : string = req.body.login.toLowerCase()
    const email : string = req.body.email.toLowerCase()
    if (login && email) {
        const user : User | null = await database.getUserByLogin(login)
        if (user !== null) {
            if (user.email === email) {
                const code = uuid()
                database.changeCodeById(user.id, code)
                sender.send(email, "Смена пароля", "http://" + config.host + ":" + config.port + "/change_password/" + code)
                res.send('На вашу почту отправлена ссылка со сменой пароля')
            }
        }
        else {
            res.send('<a href="/login">Пользователь с таким логином или email-ом не найден</a>')
        }
    }
    else {
        res.redirect("/forgot_password")
    }
})

app.get("/change_password/:code", async (req, res) => {
    const code_ex : boolean = await database.code_exists(req.params.code)
    if (code_ex) {
        res.render("change_password.ejs")
        return
    }
    res.redirect("/login")
})

app.post("/change_password/:code", async (req, res) => {
    const password_md5 : string = md5(req.body.password).toString()
    const code : string = req.params.code
    const code_ex : boolean = await database.code_exists(code)
    if (code_ex) {
        database.changePasswordByCode(password_md5, code, uuid())
        res.send('<a href="/login">Пароль сменён</a>')
        return
    }
    res.redirect("/login")
})

app.get("/active/:code", (req, res) => {
    database.active(req.params.code, uuid())
    res.redirect("/login")
})



io.on("connection", (socket: Socket) => {
    let client: Client
    socket.on("info", (data: string) => {
        const c = get_client_by_field_value("uid", data)
        if (c !== undefined) {
            client = c
            client.web_socket = socket
            socket.emit("info", client.con)
        }
    })
    socket.on("pos", (data: string) => {
        if (client !== undefined && client.con === 1) {
            mqtt.emit(client.uid+":pos", data)
        }
    })
    socket.on("disconnect", () => {
        if (client !== undefined) {
            client.web_socket = null
        }
        if (peer_id !== "" && room !== undefined && room_id !== "") {
            const index = room.indexOf(peer_id)
            if (index > -1) {
                room.splice(index, 1)
            }
            io.emit("disconn", peer_id)
        }
    })
    let peer_id: string = ""
    let room_id: string = ""
    let room: string[] | undefined
    socket.on("join", (p_id: string, r_id: string) => {
        peer_id = p_id
        room_id = r_id
        room = rooms.get(room_id)
        if (room === undefined) {
            room = []
            rooms.set(room_id, room)
        }
        if (room !== undefined) {
            room.push(peer_id)
            socket.emit("peers", room)
        }
    })
})

server.listen(config.port)