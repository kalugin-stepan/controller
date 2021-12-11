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
function parseData() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            $.ajax({
                url: "/get_users",
                method: "GET",
                success: res,
                error: rej
            });
        });
    });
}
setInterval(() => {
    parseData().then((data) => {
        const users = JSON.parse(data)["users"];
        const list = $("ul");
        list.html("");
        users.forEach((user) => {
            list.append(`<li>${user}</li>`);
        });
    });
}, 10000);
