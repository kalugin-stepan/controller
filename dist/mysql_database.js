"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = require("mysql2");
class MySQL_DataBase {
    conn;
    constructor(options) {
        this.conn = (0, mysql2_1.createConnection)(options);
    }
    async execute(sql) {
        return new Promise((res, rej) => {
            this.conn.query(sql, (err, rez) => {
                if (err) {
                    throw err;
                }
                res(rez);
            });
        });
    }
    async add_usr(login, password, email, uid, code) {
        await this.execute(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`);
    }
    async uid_exists(uid) {
        const users = await this.execute(`select * from users where uid="${uid}"`);
        if (users.length === 1) {
            return true;
        }
        return false;
    }
    async code_exists(code) {
        const users = await this.execute(`select * from users where code="${code}"`);
        if (users.length === 1) {
            return true;
        }
        return false;
    }
    async email_exists(email) {
        const users = await this.execute(`select * from users where email="${email}"`);
        if (users.length) {
            return true;
        }
        return false;
    }
    async login_exists(login) {
        const users = await this.execute(`select * from users where login="${login}"`);
        if (users.length === 1) {
            return true;
        }
        return false;
    }
    async get_user_by_ID(id) {
        const users = await this.execute(`select * from users where id="${id}"`);
        if (users.length === 1) {
            return users[0];
        }
        return null;
    }
    async get_user_by_login(login) {
        const users = await this.execute(`select * from users where login="${login}"`);
        if (users.length === 1) {
            return users[0];
        }
        return null;
    }
    async get_users() {
        return await this.execute("select * from users");
    }
    async active(code, new_code) {
        await this.execute(`update users set active=1, code="${new_code}" where code="${code}"`);
    }
    async change_code_by_ID(id, code) {
        await this.execute(`update users set code="${code}" where id="${id}"`);
    }
    async change_password_by_code(password, code, new_code) {
        await this.execute(`update users set password="${password}", code="${new_code}" where code="${code}"`);
    }
}
exports.default = MySQL_DataBase;
