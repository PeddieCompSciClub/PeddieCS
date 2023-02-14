//get the current school year (the graduation class of the seniors)
function getCurrentYear() {
    const d = new Date();
    let year = d.getFullYear() + (d.getMonth() > 6 ? 1 : 0);
    return year;
}

//convert grade names (Seniors, Juniors, etc.) to years (2023,2024,etc.)
function getYear(grade) {
    let year = getCurrentYear();
    if (grade == "Juniors") year += 1;
    if (grade == "Sophomores") year += 2;
    if (grade == "Freshmen") year += 3;
    return year;
}

//convert years (2023,2024,etc.) to grade names (Seniors, Juniors, etc.)
function getYear(year) {
    const d = new Date();
    let gradYear = getCurrentYear();
    if (year < gradYear) return "Alumni";
    if (year == gradYear) return "Seniors";
    if (year - 1 == gradYear) return "Juniors";
    if (year - 2 == gradYear) return "Sophomores";
    if (year - 3 == gradYear) return "Freshmen";
    return year;
}


//requests user data from the MySQL database
function getMembers() {
    $.get("https://peddiecs.peddie.org/nodejs/getAllMembers", {
    }, function (res) {
        if (res.message == "failed") {
            console.log("Failed to get member data")
        } else {
            for(var member in res){
                console.log(member);
            }
        }
    });

}
getMembers();