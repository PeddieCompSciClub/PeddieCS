// redirects user to login if they have an invalid login
function verifyLogin() {
    return new Promise(function (resolve, reject) {
        if (window.jQuery) {
            $.post("https://peddiecs.peddie.org/nodejs/authenticateUser", {
                token: getCookie('credential'),
            }, function (res) {
                if (res.message == "success") {
                    console.log("user validated");
                    addSignoutButton(res.credential.name);
                    appendNavbar(res.user.permissions);
                    resolve(res.user);
                } else if (res.message == "new-user") {
                    console.log("new user");
                    window.location.href = `/user/new-user.html?redirect=${encodeURIComponent(window.location)}`;
                    reject(new Error('User is not authenticated.'));
                } else {
                    console.log("failed to validate user");
                    window.location.href = `/user/login.html?redirect=${encodeURIComponent(window.location)}`;
                    reject(new Error('User is not authenticated.'));
                }
            });
        }
    });
}

function addSignoutButton(name) {
    const nav = document.getElementById("navbar-main");
    const button = document.createElement("button");
    button.classList.add("user", "sign-out");
    button.id.add("sign-out-button");
    button.textContent = name;
    button.setAttribute("onclick","console.log(test)");
    // button.addEventListener("click", function () {
    //     removeCookie("credential");
    //     window.location.href = "/index.html";
    // });
    nav.appendChild(button);
    const style = document.createElement("style");
    style.textContent = `.navbar-custom .user.sign-out::after {content: "${name}";}`;
    nav.appendChild(style);
}

function appendNavbar(permissions){
    const nav = document.getElementById("navbar-main");
    permissions = permissions.replace(' ','').split(',');
    permissions.forEach(perm => {
        if(perm == 'csfellow'){
            nav.innerHTML+='<a href="/user/csfellows">CS Fellows</a>';
        }
        if(perm == 'admin'){
            nav.innerHTML+='<a href="/user/admin">Admin Tools</a>';
        }
    });
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
}
