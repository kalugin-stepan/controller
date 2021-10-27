/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>

function is_vailid(password : string) : boolean {
    if (password.length >= 8) {
        return true;
    }
    return false;
}
function check(f : HTMLFormElement) {
    const password : string = $('input[name="password"]').val() as string;
    if (is_vailid(password)) {
        f.submit();
        return;
    }
    alert("Password is not vailid.");
}