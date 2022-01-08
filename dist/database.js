"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBase = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
class DataBase {
    constructor(db_path) {
        this.db = new sqlite3_1.default.Database(db_path);
        this.exec("create table if not exists users (id integer primary key autoincrement unique, login varchar(30), email varchar(30), password varchar(32), uid varchar(36), active tinyint(1), code varchar(36))");
    }
    async exec(cmd) {
        return new Promise((res, rej) => {
            this.db.exec(cmd, (err) => {
                if (err) {
                    rej(err);
                }
                res();
            });
        });
    }
    async select(cmd) {
        const rez = [];
        return new Promise((res, rej) => {
            this.db.each(cmd, (err, row) => {
                if (err) {
                    console.log(err.message);
                    return;
                }
                rez.push(row);
            }, (err) => {
                if (err) {
                    rej(err.message);
                }
                res(rez);
            });
        });
    }
    async add_usr(login, password, email, uid, code) {
        await this.exec(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`);
    }
    async uid_exists(uid) {
        const users = await this.select(`select * from users where uid="${uid}"`);
        if (users.length === 1) {
            return true;
        }
        return false;
    }
    async code_exists(code) {
        const users = await this.select(`select * from users where code="${code}"`);
        if (users.length === 1) {
            return true;
        }
        return false;
    }
    async email_exists(email) {
        const users = await this.select(`select * from users where email="${email}"`);
        if (users.length) {
            return true;
        }
        return false;
    }
    async login_exists(login) {
        const users = await this.select(`select * from users where login="${login}"`);
        if (users.length === 1) {
            return true;
        }
        return false;
    }
    async getUserByID(id) {
        const users = await this.select(`select * from users where id="${id}"`);
        if (users.length === 1) {
            return users[0];
        }
        return null;
    }
    async getUserByLogin(login) {
        const users = await this.select(`select * from users where login="${login}"`);
        if (users.length === 1) {
            return users[0];
        }
        return null;
    }
    async getUsers() {
        return await this.select("select * from users");
    }
    async active(code, new_code) {
        await this.exec(`update users set active=1, code="${new_code}" where code="${code}"`);
    }
    async changeCodeById(id, code) {
        await this.exec(`update users set code="${code}" where id="${id}"`);
    }
    async changePasswordByCode(password, code, new_code) {
        await this.exec(`update users set password="${password}", code="${new_code}" where code="${code}"`);
    }
}
exports.DataBase = DataBase;
