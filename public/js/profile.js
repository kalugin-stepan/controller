function getCookie(cname) {
    const name = cname + "="
    const decodedCookie = decodeURIComponent(document.cookie)
    const ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }
    return ''
}

function personalData() {
    const main = $('.profile')
    main.html('')
    const uid = getCookie('uid')
    const input = $(`<input value="${uid}" style="font-weight: bold" readonly/>`)
    input.on('mouseover', () => {
        input.css('cursor', 'pointer')
    })
    input.on('click', () => {
        navigator.clipboard.writeText(uid)
        alert('UUID copyed to clipboard')
    })
    const h3 = $(`<h3>uuid - </h3>`)
    h3.append(input)
    main.append(h3)
}

function config() {
    const main = $('.profile')
    main.html('')
    main.append($('<input name="wifi" placeholder="Wi-FI login"><br>'))
    main.append($('<input name="password" placeholder="Wi-FI password"><br>'))
    main.append($('<button name="dow">Download</button>'))
    $('button[name="dow"]').on('click', download)
}

function download() {
    const wifi = $('input[name="wifi"]').val()
    const password = $('input[name="password"]').val()
    window.location.href = `/script.zip?wifi=${wifi}&password=${password}`
}
$(() => {
    personalData()
    $('button[name="data"]').click(personalData)
    $('button[name="config"]').click(config)
})
