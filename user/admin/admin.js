function load(user){
    console.log(user);
    const permissions = user.permissions.replace(' ','').split(',');
    if(permissions.includes('admin')){
        loadmembers(user);
    }
    else{
        window.location.href = '/user/'
    }
}

function loadmembers(){
    $.get("https://peddiecs.peddie.org/nodejs/admin/getAllMembers", {
            token: getCookie('credential')
        }, function (res) {
            if (res.message == "failed") {
                console.log("Failed to get member data")
            } else {
                console.log(res);

                //add members to button list
                for(let i=0; i<res.message.length; i++){
                    var user = res.message[i];
                    var button = `<button class="memberbtn">${user.first_name+' '+user.last_name}</button>`;
                    document.getElementById("Seniors").getElementsByClassName("memberlist")[0].innerHTML += button;
                }
            }
        });
}