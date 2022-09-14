$(() => {
    $('.header__link').get().forEach(el => {
        if (el.getAttribute('href') === location.pathname) {
            el.classList.add('header__selected')
        }
    })
    let hidden = true
    const list = $('.header__list')
    $('.header__dropdown').on('click', () => {
        if (hidden) {
            hidden = false
            list.css('display', 'block')
        }
        else {
            hidden = true
            list.css('display', 'none')
        }
    })
})