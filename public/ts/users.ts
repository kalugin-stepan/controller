async function parseData() : Promise<string> {
    return new Promise((res, rej) => {
        $.ajax({
            url : "/get_users",
            method : "GET",
            success : res,
            error : rej
        });
    });
}

setInterval(() => {
    parseData().then((data: string) => {
        const users: string[] = JSON.parse(data)["users"]
        const list = $("ul");
        list.html("");
        users.forEach((user : string) => {
            list.append(`<li>${user}</li>`);
        });
    })
}, 10000);