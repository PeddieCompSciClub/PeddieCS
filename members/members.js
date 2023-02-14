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
    if(window.jQuery){
        $.get("https://peddiecs.peddie.org/nodejs/getAllMembers", {
        }, function (res) {
            if (res.message == "failed") {
                console.log("Failed to get member data")
            } else {
                for(let i=0; i<res.message.length; i++){
                    console.log(res.message[i]);
                    displayMember(res.message[i]);
                }
            }
        });
    }
}

//adds a member to the table displayed on the web page by inserting an html into the appropriate section
/* Default html block:
<div class="memberItem">
    <img src="user-images/[USERNAME].jpg"  alt="Image not found" onError="this.onerror=null;this.src='user-images/missing.jpg';">
    <a href="/members/member.html?[USERNAME]">[NAME]</a>
    <ul>
    <li></li>
    <li></li>
    <li></li>
    </ul>
</div>
# list items will eventually contain titles/projects
*/
function displayMember(json){
    let first_name = json.first_name;
    let last_name = json.last_name;
    let email = json.email;
    let username = email.substring(0, email.indexOf("@"));
    //let tab = getYear(json.year);
    document.getElementById(getYear(json.year)).getElementsByClassName("memberTable")[0].innerHTML += "<div class='memberItem'></div>"
    //console.log(first_name,last_name,email,username,year);
}

getMembers();