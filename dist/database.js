"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBase = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
class DataBase {
    constructor(db_path) {
        this.db = new sqlite3_1.default.Database(db_path);
    }
    static configure(db_path) {
        const db = new sqlite3_1.default.Database(db_path);
        db.exec("create table if not exists users (id integer primary key autoincrement unique, login varchar(30), email varchar(30), password varchar(32), uid varchar(36), active tinyint(1), code varchar(36))", (err) => {
            if (err) {
                console.log(err.message);
                return;
            }
            db.close();
        });
    }
    exec(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                this.db.exec(cmd, (err) => {
                    if (err) {
                        rej();
                    }
                    res();
                });
            });
        });
    }
    select(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    add_usr(login, password, email, uid, code) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec(`insert into users (login, email, password, uid, code, active) values("${login}", "${email}", "${password}", "${uid}", "${code}", "0")`);
        });
    }
    uid_exists(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.select(`select * from users where uid="${uid}"`);
            if (users.length === 1) {
                return true;
            }
            return false;
        });
    }
    code_exists(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.select(`select * from users where code="${code}"`);
            if (users.length === 1) {
                return true;
            }
            return false;
        });
    }
    email_exists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.select(`select * from users where email="${email}"`);
            if (users.length) {
                return true;
            }
            return false;
        });
    }
    login_exists(login) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.select(`select * from users where login="${login}"`);
            if (users.length === 1) {
                return true;
            }
            return false;
        });
    }
    getUserByID(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.select(`select * from users where id="${id}"`);
            if (users.length === 1) {
                return users[0];
            }
            return null;
        });
    }
    getUserByLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.select(`select * from users where login="${login}"`);
            if (users.length === 1) {
                return users[0];
            }
            return null;
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.select("select * from users");
        });
    }
    active(code, new_code) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec(`update users set active=1, code="${new_code}" where code="${code}"`);
        });
    }
    changeCodeById(id, code) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec(`update users set code="${code}" where id="${id}"`);
        });
    }
    changePasswordByCode(password, code, new_code) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec(`update users set password="${password}", code="${new_code}" where code="${code}"`);
        });
    }
}
exports.DataBase = DataBase;
