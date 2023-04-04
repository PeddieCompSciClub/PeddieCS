function verifyLogin() {
    if (window.jQuery) {
        // console.log(getCookie('credential'));
        //checks that the user credential is valid, if not redirect to login.html
        $.post("https://peddiecs.peddie.org/nodejs/authenticateUser", {
            token: getCookie('credential'),
        }, function (res) {
            if (res.message == "success") {
                console.log(getCookie('credential'));
            } else {
                if (res.message) {
                    console.log(res.message);
                }
            }

        });
    }
}


// cookie scripts
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}