"use strict";
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text);
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function personalData() {
    const main = $(".profile");
    main.html("");
    const login = getCookie("login");
    const uid = getCookie("uid");
    main.append($(`<h3>login - <strong>${login}</strong></h3>`));
    const input = $(`<input value="${uid}" style="font-weight: bold;" readonly/>`);
    input.hover(() => {
        input.css("cursor", "pointer");
    });
    input.click(() => {
        copyTextToClipboard(uid);
        alert("UUID copyed to clipboard");
    });
    const h3 = $(`<h3>uuid - </h3>`);
    h3.append(input);
    main.append(h3);
}
function config() {
    const main = $(".profile");
    main.html("");
    main.append($('<input name="wifi" placeholder="Wi-FI login"><br>'));
    main.append($('<input name="password" placeholder="Wi-FI password"><br>'));
    main.append($('<button name="dow">Download</button>'));
    $('button[name="dow"]').click(download);
}
function download() {
    const wifi = $('input[name="wifi"]').val();
    const password = $('input[name="password"]').val();
    window.location.href = `/script.zip?wifi=${wifi}&password=${password}`;
}
$(document).ready(() => {
    personalData();
    $('button[name="data"]').click(personalData);
    $('button[name="config"]').click(config);
});
