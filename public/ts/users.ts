async function parseData() : Promise<string[]> {
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
    parseData().then((users : string[]) => {
        const list = $("ul");
        list.html("");
        users.forEach((user : string) => {
            list.append(`<li>${user}</li>`);
        });
    })
}, 2000);