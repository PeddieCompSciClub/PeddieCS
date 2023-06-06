//load calendar
const currentDate = new Date;
const saveDate = new Date;
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
        addCalendarEvents(date.getYear(),date.getMonth(),loadedMonths.get([date.getFullYear(), date.getMonth()].toString()));
    } else {
        console.log('loading data');
        $.get('https://peddiecs.peddie.org/nodejs/csfellows/schedule', {
            date: date
        }, function (res) {
            loadedMonths.set([date.getFullYear(), date.getMonth()].toString(),res.schedule)
            addCalendarEvents(date.getYear(),date.getMonth(),loadedMonths.get([date.getFullYear(), date.getMonth()].toString()));
        });
    }
}

function addCalendarEvents(year, month, data) {
    console.log({year:year,month:month,data:data});
    for(var i=0; i<data.length; i++){
        var event = data[i]
        var eventDate = new Date(event.date);
        console.log('day-'+eventDate.getDay());
        document.getElementById('day-'+eventDate.getDate()).innerHTML += `<div class="event" style="background-color:${stringToColor(event.email)}; border-color:#00000000" onclick="loadPopup('${event.email}','${event.name}','${eventDate.getHours()}:${eventDate.getMinutes()}')">${event.name}</div>`;
    }
}

function loadPopup(email, name, time){
    const popup = document.getElementById("calendar-popup");

    popup.querySelector('#popup-img').src = '/members/user-images/' +  email.substring(0, email.indexOf("@"));
    popup.querySelector('#popup-name').innerText=name;
    popup.querySelector('#popup-time').innerText=time;

    popup.style="display:block";
}


function stringToColor(text){
    var hash = stringToHash(text);
    let r = 127+((hash & 0xFF0000) >> 16)/2;
    let g = 127+((hash & 0x00FF00) >> 8)/2;
    let b = 127+((hash & 0x0000FF))/2;
    
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