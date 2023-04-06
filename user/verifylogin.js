var user;

// redirects user to login if they have an invalid login
function verifyLogin() {
    if (window.jQuery) {
        // console.log(getCookie('credential'));
        //checks that the user credential is valid, if not redirect to login.html
        $.post("https://peddiecs.peddie.org/nodejs/authenticateUser", {
            token: getCookie('credential'),
        }, function (res) {
            // console.log(res);
            if (res.message == "success") {
                console.log("user validated");
                console.log(res.user());
            } else if (res.message == "new-user") {
                console.log("new user");
                window.location.href = `new-user.html?redirect=${encodeURIComponent(window.location)}`
            } else {
                console.log("failed to validate user");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location)}`
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
function removeCookie(cname) {
    document.cookie = cname + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    location.reload();
}
