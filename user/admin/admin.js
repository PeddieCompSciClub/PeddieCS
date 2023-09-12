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
var memberData;
function loadmembers() {
    $.get("https://peddiecs.peddie.org/nodejs/admin/getAllMembers", {
        token: getCookie('credential')
    }, function (res) {
        if (res.message == "failed") {
            console.log("Failed to get member data")
        } else {
            memberData = res.message;

            //add members to button list
            for (let i = 0; i < res.message.length; i++) {
                var user = res.message[i];
                var memberButton = `<button class="memberbtn" id="members-${user.email.substring(0, user.email.indexOf("@peddie.org"))}" onclick="changeMember('${user.email}');">${user.first_name + ' ' + user.last_name}</button>`;
                document.getElementById(getGrade(user.year)).getElementsByClassName("memberlist")[0].innerHTML += memberButton;

                var permissionButton = `<button class="memberbtn" id="permissions-${user.email.substring(0, user.email.indexOf("@peddie.org"))}" onclick="loadPermissionMember('${user.email}');">${user.first_name + ' ' + user.last_name}</button>`;
                document.getElementById('permission'+getGrade(user.year)).getElementsByClassName("memberlist")[0].innerHTML += permissionButton;
            }

            //set active view active
            document.getElementById("membersearch").addEventListener("input", function () {
                var text = document.getElementById("membersearch").value;
                search(text);
                document.getElementById("permissionsearch").value = text;
            });
            document.getElementById("permissionsearch").addEventListener("input", function () {
                var text = document.getElementById("permissionsearch").value;
                search(text);
                document.getElementById("membersearch").value = text;
            });
            function search(text){
                var members = document.getElementsByClassName("memberbtn");
                var search = text.toLowerCase();
                for (var i = 0; i < members.length; i++) {
                    if (members[i].innerText.toLowerCase().includes(search) || members[i].id.substring(8).includes(search)) {
                        members[i].style.display = 'block';
                    }
                    else {
                        members[i].style.display = 'none';
                    }
                }
            }

            //set listeners for profile
            const memberProfile = document.getElementById('memberprofile');
            memberProfile.querySelector('#university').addEventListener('input', function () { requireMemberSave(true); })
            memberProfile.querySelector('#bio').addEventListener('input', function () { requireMemberSave(true); })

            //default compsciclub@peddie.org
            document.getElementById('members-compsciclub').classList.add('active');
            document.getElementById('permissions-compsciclub').classList.add('active');
            loadMember('compsciclub@peddie.org');
            loadPermissionMember('compsciclub@peddie.org');
        }
    });
}
function requireMemberSave(require) {
    if (require) {
        memberSaved = false;
        document.getElementById('updatememberprofile').classList.add('updatevalid');
    } else {
        memberSaved = true;
        document.getElementById('updatememberprofile').classList.remove('updatevalid');
    }
}

//loads profile for selected member
function loadMember(email) {
    const user = memberData.filter(function (item) { return item.email == email; })[0];
    const memberProfile = document.getElementById('memberprofile');
    memberProfile.querySelector('#name').innerText = user.first_name + ' ' + user.last_name;
    memberProfile.querySelector('#email').innerText = user.email;
    memberProfile.querySelector('#image').src = `/members/user-images/${email.substring(0, user.email.indexOf("@peddie.org"))}`
    memberProfile.querySelector('#image-file').value = null;
    newImage = false;
    memberProfile.querySelector('#university').value = decodeURIComponent(user.university);
    memberProfile.querySelector('#bio').value = decodeURIComponent(user.bio).replace(/\n/g, `\n`);
    document.getElementById('counter').innerHTML = `${decodeURIComponent(user.bio).replace(/\n/g, `\n`).length}/${1000}`;
    memberProfile.querySelector('#visibility').innerText = (user.public >= 1 ? 'Make Private' : 'Make Public');
    requireMemberSave(false);
    const members = document.getElementsByClassName('memberbtn');
    for (var i = 0; i < members.length; i++) {
        members[i].classList.remove('active')
    }
    document.getElementById('members-' + email.substring(0, user.email.indexOf("@peddie.org"))).classList.add('active');
}

//loads permissions for selected member
function loadPermissionMember(email) {
    const user = memberData.filter(function (item) { return item.email == email; })[0];

    // visually select user
    const members = document.getElementsByClassName('memberbtn');
    for (var i = 0; i < members.length; i++) {
        members[i].classList.remove('active')
    }
    document.getElementById('permissions-' + email.substring(0, user.email.indexOf("@peddie.org"))).classList.add('active');

    //load user permission table
    const table = document.getElementById("permission-student");
    table.getElementsByClassName("label")[0].innerText = user.first_name + ' ' + user.last_name;
    var tableListItems = table.getElementsByTagName("li");
    while(tableListItems.length > 0) tableListItems[0].parentNode.removeChild(tableListItems[0]);
    const perms = user.permissions.split(',');
    for(let i=0; i<perms.length; i++){
        let li = document.createElement('li');
        li.innerHTML = `${perms[i]}<button>X<button>`;//add appropriate script to buttons (removePermission)
        table.insertBefore(li, table.lastChild);
    }
}

// checks for unsaved changes before loading new member
function changeMember(email) {
    if (memberSaved) {
        loadMember(email);
    }
    else {
        document.getElementById('confirmExit').email = email;
        document.getElementById('confirmExit').style = 'display:block';
    }
}

function updateVisibility() {
    let email = document.getElementById('memberprofile').querySelector('#email').innerText;
    let user = memberData.filter(function (item) { return item.email == email; })[0];
    user.public = (user.public >= 1 ? 0 : 1);
    document.getElementById('memberprofile').querySelector('#visibility').innerText = (user.public >= 1 ? 'Make Private' : 'Make Public');
    requireMemberSave(true);
}

function applyMemberChanges() {
    if (!memberSaved) {
        const profile = document.getElementById('memberprofile');
        const email = profile.querySelector('#email').innerText;
        const userUniversity = encodeURIComponent(profile.querySelector('#university').value);
        const userBio = encodeURIComponent(profile.querySelector('#bio').value);
        const userPublic = memberData.filter(function (item) { return item.email == email; })[0].public;

        member = memberData.filter(function (item) { return item.email == email; })[0];
        member.university = userUniversity;
        member.bio = userBio;

        console.log("saving member data");
        console.log(email + '\n' + userUniversity + '\n' + userBio + '\n' + userPublic)

        $.post("https://peddiecs.peddie.org/nodejs/admin/updateUserProfile", {
            token: getCookie('credential'),
            email: email,
            bio: userBio,
            university: userUniversity,
            public: userPublic,
        }, function (res) {
            if (res.message = "success") {
                requireMemberSave(false);
            }
        });

        var image = $('#image-file')[0].files[0];
        if (image) {
            var reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onload = function () {
                var imageData = reader.result.split(',')[1];
                $.post("https://peddiecs.peddie.org/nodejs/admin/updateUserImage", {
                    token: getCookie('credential'),
                    email: email,
                    image: imageData
                }, function (res) {
                    if (res.message == "success") {
                        // console.log("success "+ res.newVal);
                    }
                    else {
                        console.log("failed");
                    }
                });
            };
        }

    }
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
    let year = d.getFullYear() + (d.getMonth() >= 5 ? 1 : 0);
    return year;
}
