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

interface IDataBase {
    add_usr(login : string, password : string, email : string, uid : string, code : string): Promise<void>
    uid_exists(uid : string): Promise<boolean>
    code_exists(code : string): Promise<boolean>
    email_exists(email : string): Promise<boolean>
    login_exists(login : string): Promise<boolean>
    get_user_by_ID(id : number): Promise<User | null>
    get_user_by_login(login : string): Promise<User | null>
    get_users(): Promise<Array<User>>
    active(code : string, new_code : string): Promise<void>
    change_code_by_ID(id : number, code : string): Promise<void>
    change_password_by_code(password : string, code : string, new_code : string): Promise<void>
}

export default IDataBase
export {User, bool}