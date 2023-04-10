
//requests user data from the MySQL database
function getMember(email) {
    if(window.jQuery){
        $.get("https://peddiecs.peddie.org/nodejs/getMemberData", {
            "email":email
        }, function (res) {
            if (res.message == "failed") {
                console.log("Failed to get member data")
            } else {
                console.log(res);
            }
        });
    }
}