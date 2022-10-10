import sqlite from 'sqlite3'

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

    async addUsr(login : string, password : string, email : string, uid : string, code : string): Promise<void> {
        await this.exec(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`)
    }

    async uidExists(uid : string): Promise<boolean> {
        const users = await this.select(`select * from users where uid="${uid}"`) as User[]
        if (users.length === 1) {
            return true
        }
        return false
    }

    async codeExists(code : string): Promise<boolean> {
        const users = await this.select(`select * from users where code="${code}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }

    async emailExists(email : string): Promise<boolean> {
        const users = await this.select(`select * from users where email="${email}"`)
        if (users.length) {
            return true
        }
        return false
    }

    async loginExists(login : string): Promise<boolean> {
        const users = await this.select(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }

    async getUserByID(id : number): Promise<User | null> {
        const users = await this.select(`select * from users where id="${id}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }

    async getUserByLogin(login : string): Promise<User | null> {
        const users = await this.select(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }

    async getUsers(): Promise<Array<User>> {
        return await this.select('select * from users')
    }

    async active(code : string, new_code : string): Promise<void> {
        await this.exec(`update users set active=1, code="${new_code}" where code="${code}"`)
    }

    async changeCodeById(id : number, code : string): Promise<void> {
        await this.exec(`update users set code="${code}" where id="${id}"`)
    }

    async changePasswordByCode(password : string, code : string, new_code : string): Promise<void> {
        await this.exec(`update users set password="${password}", code="${new_code}" where code="${code}"`)
    }

}

export {DataBase, User, bool}