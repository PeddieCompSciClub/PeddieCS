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
    if (year == 0) return "Faculty";
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

//submits new user data to mySQL database
function submitMember() {
    $('#body')[0].style.display="none";
    $('#text')[0].style.display="block";
    
    document.getElementById("text").innerHTML = "<h3 style='text-align:center;'>Check your email to verify your account:</h3><h4>"+$('#email').val()+"</h4>";

    if(window.jQuery){
        // Check if an image has been selected
        var image = $('#image')[0].files[0];
        if (image) {
            // Convert image to base64-encoded string
            var reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onload = function () {
                var imageData = reader.result.split(',')[1];
                // Send POST request with image data included as a parameter
                $.post("https://peddiecs.peddie.org/nodejs/submitMember", {
                    first_name: $('#first-name').val(),
                    last_name: $('#last-name').val(),
                    email: $('#email').val(),
                    image: imageData
                }, function (res) {
                    if (res.error == "true") {
                        console.log("Failed to add member data")
                    }
                });
            };
        } else {
            // Send POST request without image data
            $.post("https://peddiecs.peddie.org/nodejs/submitMember", {
                first_name: $('#first-name').val(),
                last_name: $('#last-name').val(),
                email: $('#email').val()
            }, function (res) {
                if (res.error == "true") {
                    console.log("Failed to add member data")
                }
            });
        }
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

    console.log(first_name+" "+last_name+" "+email+" "+username+" "+getYear(json.year))

    let newDiv = '<div class="memberItem"><img src="user-images/'+username+'" alt="Image not found" onError="this.onerror=null;this.src=\'user-images/missing.jpg\';"><a href="/members/member.html?'+username+'">'+first_name+' '+last_name+'</a><ul><li></li></ul></div>'

    let yearElement = document.getElementById(getYear(json.year));
    if (yearElement) {
        let memberTableElement = yearElement.getElementsByClassName("memberTable")[0];
        if (memberTableElement) {
            memberTableElement.innerHTML += newDiv;
        }
    }
}


getMembers();