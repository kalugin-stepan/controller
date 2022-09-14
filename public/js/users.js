async function parseData() {
    return new Promise((res, rej) => {
        $.ajax({
            url : '/get_users',
            method : 'GET',
            success : res,
            error : rej
        });
    });
}

setInterval(() => {
    parseData().then((data) => {
        const users = JSON.parse(data)['users']
        const list = $('ul');
        list.html('');
        users.forEach((user) => {
            list.append(`<li>${user}</li>`);
        });
    })
}, 10000);