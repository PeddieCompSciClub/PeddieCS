function load(user) {
    const permissions = user.permissions.replace(' ', '').split(',');
    if (permissions.includes('admin')) {
        loadmembers(user);
    }
    else {
        window.location.href = '/user/'
    }
}

var memberSaved = true;
function loadmembers() {
    $.get("https://peddiecs.peddie.org/nodejs/admin/getAllMembers", {
        token: getCookie('credential')
    }, function (res) {
        if (res.message == "failed") {
            console.log("Failed to get member data")
        } else {
            // console.log(res);

            //add members to button list
            for (let i = 0; i < res.message.length; i++) {
                var user = res.message[i];
                var button = `<button class="memberbtn" id="members_${user.email}">${user.first_name + ' ' + user.last_name}</button>`;
                document.getElementById(getGrade(user.year)).getElementsByClassName("memberlist")[0].innerHTML += button;
            }

            //set active view active
            document.getElementById('members_compsciclub@peddie.org').classList.add('active');
            document.getElementById("membersearch").addEventListener("input", function () {
                var members = document.getElementsByClassName("memberbtn");
                var search = document.getElementById("membersearch").value;
                for (var i = 0; i < members.length; i++) {
                    if (members[i].innerText.includes(search) || members[i].id.substring(8).includes(search)) {
                        console.log(members[i]);
                    }
                }
            });
        }
    });
}

function getGrade(year) {
    const d = new Date();
    let gradYear = getCurrentYear();
    if (year == 0) return "Faculty";
    if (year < gradYear) return "Alumni";
    if (year == gradYear) return "Seniors";
    if (year - 1 == gradYear) return "Juniors";
    if (year - 2 == gradYear) return "Sophomores";
    if (year - 3 == gradYear) return "Freshmen";
    return year;
}

//get the current school year (the graduation class of the seniors)
function getCurrentYear() {
    const d = new Date();
    let year = d.getFullYear() + (d.getMonth() > 6 ? 1 : 0);
    return year;
}
