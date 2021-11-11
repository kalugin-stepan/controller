import {Connection, ConnectionOptions, createConnection, QueryError} from "mysql2"
import path from "path"

type bool = 1 | 0

interface User {
    id : number
    login : string
    email : string
    password : string
    uid : string
    active : bool
    code : string
}

class DataBase {

    private readonly conn : Connection

    constructor(config: ConnectionOptions) {
        this.conn = createConnection(config)
    }

    static configure(config: ConnectionOptions) {
        const conn = createConnection({
            host : config.host,
            user : config.user,
            password : config.password,
            port : config.port
        })
        conn.query(`create database ${config.database}`)
        conn.query(`use ${config.database}`)
        conn.query("create table users (id int auto_increment primary key, login varchar(30), email varchar(30), password varchar(32), uid varchar(36), active tinyint(1), code varchar(36))")
        conn.end()
    }

    private async execute(sql: string): Promise<any[]> {
        return new Promise<any[]>((res, rej) => {
            this.conn.query(sql, (err: QueryError, rez: any[]) => {
                if (err) {
                    throw err
                }
                res(rez)
            })
        })
    }

    async add_usr(login : string, password : string, email : string, uid : string, code : string): Promise<void> {
        await this.execute(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`)
    }

    async uid_exists(uid : string): Promise<boolean> {
        const users = await this.execute(`select * from users where uid="${uid}"`) as User[]
        if (users.length === 1) {
            return true
        }
        return false
    }

    async code_exists(code : string): Promise<boolean> {
        const users = await this.execute(`select * from users where code="${code}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }

    async email_exists(email : string): Promise<boolean> {
        const users = await this.execute(`select * from users where email="${email}"`)
        if (users.length) {
            return true
        }
        return false
    }

    async login_exists(login : string): Promise<boolean> {
        const users = await this.execute(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }

    async getUserByID(id : number): Promise<User | null> {
        const users = await this.execute(`select * from users where id="${id}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }

    async getUserByLogin(login : string): Promise<User | null> {
        const users = await this.execute(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }

    async getUsers(): Promise<Array<User>> {
        return await this.execute("select * from users")
    }

    async active(code : string, new_code : string): Promise<void> {
        await this.execute(`update users set active=1, code="${new_code}" where code="${code}"`)
    }

    async changeCodeById(id : number, code : string): Promise<void> {
        await this.execute(`update users set code="${code}" where id="${id}"`)
    }

    async changePasswordByCode(password : string, code : string, new_code : string): Promise<void> {
        await this.execute(`update users set password="${password}", code="${new_code}" where code="${code}"`)
    }

}

export {DataBase, User, bool}