// EVENT CALENDAR ----------------------------------------------

//load calendar
const currentDate = new Date;
const saveDate = new Date;
var displayTodaysFellows = false;

function loadCalendarDates(date) {
    console.log(date);
    //load month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const calendar = document.getElementById("calendar");
    calendar.getElementsByClassName("month")[0].innerHTML = `<h1>${monthNames[date.getMonth()]}</h1><h2>${date.getFullYear()}</h2>`;
    [].forEach.call(document.querySelectorAll('.day'), function (day) { day.parentNode.removeChild(day); });
    //load days
    //note leap year exceptions if (year%4==0 && year%100=0 && year%400!=0)
    var d = new Date(date.getTime());
    var days = [];
    d.setDate(1);
    for (var i = d.getDay(); i > 0; i--) {
        days.push(monthDays[(((d.getMonth() - 1) % 12) + 12) % 12] - i + 1);
    }
    if (d.getMonth() == 2 && d.getFullYear() % 4 == 0) days.push(29);
    for (var i = 0; days.length < 42; i++) {
        days.push(i % (monthDays[d.getMonth()] + ((d.getMonth() == 1 && d.getFullYear() % 4 == 0) ? 1 : 0)) + 1)
    }
    for (var i = 0; i < days.length; i++) {
        document.getElementById('calendar-body').innerHTML += `<div class="day${((i < 7 && days[i] > 14) || (i > 21 && days[i] < 14)) ? ' off' : ''}${currentDate.getDate() == i - d.getDay() + 1 && currentDate.toDateString() == date.toDateString() ? ' today' : ''}"${((i < 7 && days[i] > 14) || (i > 21 && days[i] < 14)) ? '' : 'id="day-' + days[i] + '"'}>${days[i]}</div>`;
    }
    //load next month
    document.getElementById("prev-month").innerText = '\u25c0 ' + monthNames[((d.getMonth() - 1) % 12 + 12) % 12];//weird stuff to deal with negatives
    document.getElementById("prev-month").onclick = function onclick() { saveDate.setMonth(saveDate.getMonth() - 1); loadCalendarDates(saveDate); };
    document.getElementById("next-month").innerText = monthNames[(d.getMonth() + 1) % 12] + ' \u25b6';
    document.getElementById("next-month").onclick = function onclick() { saveDate.setMonth(saveDate.getMonth() + 1); loadCalendarDates(saveDate); };
    //load fellows
    loadMonth(date);
}

const loadedMonths = new Map();
//add events to calendar
function loadMonth(date) {
    console.log([date.getMonth(), date.getFullYear()].toString());
    if (loadedMonths.has([date.getFullYear(), date.getMonth()].toString())) {
        addCalendarEvents(date.getYear(), date.getMonth(), loadedMonths.get([date.getFullYear(), date.getMonth()].toString()));
    } else {
        console.log('loading data');
        $.get('https://peddiecs.peddie.org/nodejs/events/schedule', {
            date: date
        }, function (res) {
            loadedMonths.set([date.getFullYear(), date.getMonth()].toString(), res.schedule)
            addCalendarEvents(date.getYear(), date.getMonth(), loadedMonths.get([date.getFullYear(), date.getMonth()].toString()));
        });
    }
}

var loadIcons = true;
function addCalendarEvents(year, month, data) {
    console.log({ year: year, month: month, data: data });
    for (var i = 0; i < data.length; i++) {
        var event = data[i]
        var eventDate = new Date(event.date.substring(0, event.date.length - 1));

        document.getElementById('day-' + eventDate.getDate()).innerHTML += `<div class="event" style="background-color:${stringToColor(event.club)}; border-color:#00000000" onclick="loadPopup('${event.club}','${event.event}','${eventDate.getHours()}','${eventDate.getMinutes()}')">${event.event}</div>`;

        if (eventDate.toDateString() == currentDate.toDateString() && loadIcons) {
            console.log("Today's Event: " + event.event);
            loadPreview(event.club, event.event, eventDate.getHours(), eventDate.getMinutes());
        };
    }
    loadIcons = false;
}

// come back to this later
function loadPopup(email, name, hour, minute) {
    // const popup = document.getElementById("calendar-popup");

    // let hour2 = (hour%12)+1;
    // hour = ((parseInt(hour)+11)%12)+1;

    // const time = (hour)+':'+(minute<10?'0':'') + minute + '-' + (hour2)+':'+(minute<10?'0':'') + minute

    // popup.querySelector('#popup-img').src = '/members/user-images/' +  email.substring(0, email.indexOf("@"));
    // popup.querySelector('#popup-name').innerText=name;
    // popup.querySelector('#popup-time').innerText=time;

    // popup.style="display:block";
}

function loadPreview(email, name, hour, minute) {
    let hour2 = (hour % 12) + 1;
    hour = ((parseInt(hour) + 11) % 12) + 1;

    document.getElementById('fellows-preview').innerHTML +=
        `<div class="icon">
            <div class="memberItem">
                <img src="/members/user-images/${email.substring(0, email.indexOf("@"))}" alt="member image"onError="this.onerror=null;this.src='/members/user-images/missing.jpg';">
                <a>${name}</a>
                <p>${(hour) + ':' + (minute < 10 ? '0' : '') + minute + '-' + (hour2) + ':' + (minute < 10 ? '0' : '') + minute}</p>
            </div>
        </div>`;

}

function stringToColor(text) {
    var hash = stringToHash(text);
    let r = 127 + ((hash & 0xFF0000) >> 16) / 2;
    let g = 127 + ((hash & 0x00FF00) >> 8) / 2;
    let b = 127 + ((hash & 0x0000FF)) / 2;

    //println(hash,r,g,b);
    return `rgb(${r},${g},${b})`;
}

function stringToHash(string) {
    var hash = 0;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}




//----CSFellows Preview-----------------------------------
function loadFellows() {
    var fellows;
    $.get('https://peddiecs.peddie.org/nodejs/csfellows/schedule', {
        date: currentDate.toDateString()
    }, function (res) {
        fellows = res.schedule
        console.log(res);

        //filter fellows to only be from the current week
        let min = new Date();
        min.setDate(min.getDate() - min.getDay());//sets min to prev monday
        min.setHours(0,0,0,0);
        let max = new Date();
        max.setDate(max.getDate() + 6-max.getDay());
        max.setHours(24,0,0,0);
        for(let i=fellows.length-1; i>=0; i--){
            let fellow = fellows[i];
            let date = new Date(fellow.date.substring(0,fellow.date.length-1));
            if(min>date || date>=max){
                fellows.pop(i);
            }
        }

        console.log(fellows)

        /* //display csfellows for the day (uses 'https://peddiecs.peddie.org/nodejs/csfellows/schedule/day')
        for(let i=0; i<fellows.length; i++){
            var fellow = fellows[i];
            var eventDate = new Date(fellow.date.substring(0,fellow.date.length-1));

            if(eventDate.toDateString() == currentDate.toDateString()){
                console.log("Today's Fellow: "+fellow.name);
                loadFellowsPreview(fellow.email,fellow.name,eventDate.toString(),fellow.duration,fellow.location);
            };
        }*/

        if(fellows.length==0){
            loadFellowsSchedule();
        }
    });
}
function loadFellowsPreview(email,name,datetime,duration,location){
    datetime = new Date(datetime);
    let hour = datetime.getHours()%12;
    let minute = datetime.getMinutes();
    datetime.setMinutes(datetime.getMinutes()+duration);
    let hour2 = datetime.getHours()%12;
    let minute2 = datetime.getMinutes();
    // console.log(email,name,datetime,duration,location);
    // console.log(hour, minute, hour2, minute2);

    document.getElementById('fellows-preview').innerHTML +=
        `<div class="icon">
            <div class="memberItem">
                <img src="/members/user-images/${email.substring(0, email.indexOf("@"))}" alt="member image"onError="this.onerror=null;this.src='/members/user-images/missing.jpg';">
                <a>${name}</a>
                <p>${(hour)+':'+(minute<10?'0':'') + minute + '-' + (hour2)+':'+(minute2<10?'0':'') + minute2}  ${datetime.getHours()<12 ? 'AM':'PM'}</p>
                ${location?'<p>'+location+'</p>':''}
            </div>
        </div>`;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function loadFellowsSchedule(){
    loadFellowsScheduleJSON().then((response) => {
        let schedule = response.schedule;
        console.log(schedule);
        list = document.createElement('div');
        list.classList.add('memberItem');
        list.setAttribute('id','fellows-schedule');

        for(let i=0; i<dayNames.length; i++){
            if(i==0 && schedule["Sunday"].length==0) i++;
            console.log(schedule[dayNames[i]]);
            item = document.createElement('div');
            item.classList.add('fellows-schedule-item');
            item.innerHTML = `<h4>${dayNames[i]}</h4>`

            list.appendChild(item);
        }
        console.log(list);
    });
}

async function loadFellowsScheduleJSON() {
    const response = await fetch('https://peddiecs.peddie.org/csfellows/schedule.json');
    const data = await response.json();
    return data;
};