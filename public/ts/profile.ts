function fallbackCopyTextToClipboard(text: string): void {
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
  function copyTextToClipboard(text: string): void {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text);
  }

function getCookie(cname : string): string {
    var name = cname + "=";
    var decodedCookie : string = decodeURIComponent(document.cookie);
    var ca : string[] = decodedCookie.split(';');
    for(var i : number = 0; i < ca.length; i++) {
        var c : string = ca[i];
        while (c.charAt(0) === ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function personalData(): void {
    const main : JQuery<HTMLDivElement> = $(".profile");
    main.html("");
    const login : string = getCookie("login");
    const uid : string = getCookie("uid");
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

function config(): void {
    const main : JQuery<HTMLDivElement> = $(".profile");
    main.html("");
    main.append($('<input name="wifi" placeholder="Wi-FI login"><br>'));
    main.append($('<input name="password" placeholder="Wi-FI password"><br>'));
    main.append($('<button name="dow">Download</button>'));
    $('button[name="dow"]').click(download);
}

function download(): void {
    const wifi : string = $('input[name="wifi"]').val() as string;
    const password : string = $('input[name="password"]').val() as string;
    window.location.href = `/script.zip?wifi=${wifi}&password=${password}`;
}

$(document).ready(() => {
    personalData();
    $('button[name="data"]').click(personalData);
    $('button[name="config"]').click(config);
});