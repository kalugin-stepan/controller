import sqlite from 'sqlite3'
import IDataBase, { User, bool } from './database'



class SQLite_DataBase implements IDataBase {

    private readonly db: sqlite.Database

    constructor(db_path: string) {
        this.db = new sqlite.Database(db_path)
        this.exec('create table if not exists users (id integer primary key autoincrement unique, login varchar(30), email varchar(30), password varchar(32), uid varchar(36), active tinyint(1), code varchar(36))')
    }

    private async exec(cmd: string): Promise<void> {
        return new Promise((res, rej) => {
            this.db.exec(cmd, (err) => {
                if (err) {
                    rej(err)
                }
                res()
            })
        })
    }

    private async select(cmd: string): Promise<any[]> {
        const rez: any[] = []
        return new Promise((res, rej) => {
            this.db.each(cmd, (err, row) => {
                if (err) {
                    console.log(err.message)
                    return
                }
                rez.push(row)
            }, (err) => {
                if (err) {
                    rej(err.message)
                }
                res(rez)
            })
        })
    }

    async add_usr(login : string, password : string, email : string, uid : string, code : string): Promise<void> {
        await this.exec(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`)
    }

    async uid_exists(uid : string): Promise<boolean> {
        const users = await this.select(`select * from users where uid="${uid}"`) as User[]
        if (users.length === 1) {
            return true
        }
        return false
    }

    async code_exists(code : string): Promise<boolean> {
        const users = await this.select(`select * from users where code="${code}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }

    async email_exists(email : string): Promise<boolean> {
        const users = await this.select(`select * from users where email="${email}"`)
        if (users.length) {
            return true
        }
        return false
    }

    async login_exists(login : string): Promise<boolean> {
        const users = await this.select(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }

    async get_user_by_ID(id : number): Promise<User | null> {
        const users = await this.select(`select * from users where id="${id}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }

    async get_user_by_login(login : string): Promise<User | null> {
        const users = await this.select(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }

    async get_users(): Promise<Array<User>> {
        return await this.select('select * from users')
    }

    async active(code : string, new_code : string): Promise<void> {
        await this.exec(`update users set active=1, code="${new_code}" where code="${code}"`)
    }

    async change_code_by_ID(id : number, code : string): Promise<void> {
        await this.exec(`update users set code="${code}" where id="${id}"`)
    }

    async change_password_by_code(password : string, code : string, new_code : string): Promise<void> {
        await this.exec(`update users set password="${password}", code="${new_code}" where code="${code}"`)
    }

}

export {SQLite_DataBase, User, bool}