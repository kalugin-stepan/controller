function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement('textarea')
    textArea.value = text
    
    // Avoid scrolling to bottom
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
  
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
  
    try {
      var successful = document.execCommand('copy')
      var msg = successful ? 'successful' : 'unsuccessful'
      console.log('Fallback: Copying text command was ' + msg)
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err)
    }
  
    document.body.removeChild(textArea)
  }
  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text)
      return
    }
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!')
    }, function(err) {
      console.error('Async: Could not copy text: ', err)
    })
  }

function personalData() {
    const main = $('.profile')
    main.html('')
    const uid = getCookie('uid')
    const input = $(`<input value='${uid}' style='font-weight: bold' readonly/>`)
    input.on('mouseover', () => {
        input.css('cursor', 'pointer')
    })
    input.on('click', () => {
        copyTextToClipboard(uid)
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
    $('button[name="data"]').on('click', personalData)
    $('button[name="config"]').on('click', config)
})
