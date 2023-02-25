import { Connection, createConnection, ConnectionOptions, QueryError } from 'mysql2'
import IDataBase, { User, bool } from './database'

class MySQL_DataBase implements IDataBase {
    private readonly conn: Connection
    constructor(options: ConnectionOptions) {
        this.conn = createConnection(options)
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

    async add_usr(login: string, password: string, email: string, uid: string, code: string): Promise<void> {
        await this.execute(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`)
    }
    async uid_exists(uid: string): Promise<boolean> {
        const users = await this.execute(`select * from users where uid="${uid}"`) as User[]
        if (users.length === 1) {
            return true
        }
        return false
    }
    async code_exists(code: string): Promise<boolean> {
        const users = await this.execute(`select * from users where code="${code}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }
    async email_exists(email: string): Promise<boolean> {
        const users = await this.execute(`select * from users where email="${email}"`)
        if (users.length) {
            return true
        }
        return false
    }
    async login_exists(login: string): Promise<boolean> {
        const users = await this.execute(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return true
        }
        return false
    }
    async get_user_by_ID(id: number): Promise<User | null> {
        const users = await this.execute(`select * from users where id="${id}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }
    async get_user_by_login(login: string): Promise<User | null> {
        const users = await this.execute(`select * from users where login="${login}"`)
        if (users.length === 1) {
            return users[0]
        }
        return null
    }
    async get_users(): Promise<User[]> {
        return await this.execute("select * from users")
    }
    async active(code: string, new_code: string): Promise<void> {
        await this.execute(`update users set active=1, code="${new_code}" where code="${code}"`)
    }
    async change_code_by_ID(id: number, code: string): Promise<void> {
        await this.execute(`update users set code="${code}" where id="${id}"`)
    }
    async change_password_by_code(password: string, code: string, new_code: string): Promise<void> {
        await this.execute(`update users set password="${password}", code="${new_code}" where code="${code}"`)
    }   
}

export default MySQL_DataBase