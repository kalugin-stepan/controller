"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>
function is_vailid(password) {
    if (password.length >= 8) {
        return true;
    }
    return false;
}
function check(f) {
    const password = $('input[name="password"]').val();
    if (is_vailid(password)) {
        f.submit();
        return;
    }
    alert("Password is not vailid.");
}
