//csfellows has a special extra sign-in bit to display the zoom link

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
                // console.log(res.user);
                addProfileButton(res.credential.name);

            } else if (res.message == "new-user") {
                console.log("new user");
                // window.location.href = `new-user.html?redirect=${encodeURIComponent(window.location)}`;
                addProfileButton(res.credential.name);
            } else {
                console.log("failed to validate user");
                addSigninButton();
            }
        });
    }
}

function addProfileButton(name) {
    const nav = document.getElementsByClassName("navbar-full")[0];
    const button = document.createElement("button");
    button.classList.add("user");
    button.textContent = name;
    button.addEventListener("click", function () {
        window.location.href = "/user/";
    });
    nav.appendChild(button);

    //add zoom link (sign in button)
    document.getElementById('info').innerHTML += `<h3>Connect to Zoom</h3><button class="join-zoom" id="join-zoom"><h3>Join</h3></button>`

    $.get("https://peddiecs.peddie.org/nodejs/csfellows/getZoomLink", {
        token: getCookie('credential')
    }, function (res) {
        if (res.message == "failed") {
            console.log("Failed to get zoom link")
        } else {
            document.getElementById('join-zoom').addEventListener("click", function () {
                removeCookie("credential");
                window.location.href = `/user/login.html?redirect=${encodeURIComponent(window.location)}`;
            });     
        }
    });
}

function addSigninButton() {
    const nav = document.getElementsByClassName("navbar-full")[0];
    const button = document.createElement("button");
    button.classList.add("user");
    // button.textContent = name;
    button.addEventListener("click", function () {
        removeCookie("credential");
        window.location.href = `/user/login.html?redirect=${encodeURIComponent(window.location)}`;
    });
    button.textContent = "Sign In";
    nav.appendChild(button);

    //add zoom link (sign in button)
    document.getElementById('info').innerHTML += `<h3>Connect to Zoom</h3><button class="join-zoom" id="join-zoom"><h3>Sign In</h3></button>`
    document.getElementById('join-zoom').addEventListener("click", function () {
        removeCookie("credential");
        window.location.href = `/user/login.html?redirect=${encodeURIComponent(window.location)}`;
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