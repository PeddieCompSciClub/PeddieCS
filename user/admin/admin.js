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
    $.get("https://peddiecs.peddie.org/nodejs/getAllMembers", {
        }, function (res) {
            if (res.message == "failed") {
                console.log("Failed to get member data")
            } else {
                console.log(res);
            }
        });
}