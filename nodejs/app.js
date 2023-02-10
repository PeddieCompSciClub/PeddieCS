const mysql = require('mysql');
const express = require('express');
const app = express();
const port = 5622;
// var router = express.Router();

var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieCS",
    port: 3306
});



/*
 * The most important part of the code :), this tells express to listen on port 5622 of the local host
 * (our proxy will route the requests to us, if you need a refresher on that just look through the docs)
 */
app.listen(port, () => {
    console.log(`Server running on port${port}`);
});

/*
 *  Allows user to pass arguments through command line (mainly for debugging)
 *  for example:
 *  $ node app.js addMember Tomaz Chevres tchevres-24@peddie.org 2024
 *  sets process.argv to ['user/bin/node','/var/www/CSProjects/nodejs/app.js','addMember','Tomaz','Chevres','tchevres-24@peddie.org','2024']
 *  and adds the member to the database
 */
switch (process.argv[2]) {
    case 'debug':
        process.argv.forEach((value, index) => {
            console.log(index, value);
        });
        break;
    case 'addMember':
        addMember(process.argv[3], process.argv[4], process.argv[5], parseInt(process.argv[6]));
        break;
}


//Test
// function read() {
//     con.connect(function (err) {
//         if (err) throw err;
//         console.log("Connected!");

//         con.query("SELECT * FROM members", function (err, result, fields) {
//             if (err) throw err;
//             console.log(result);
//         });
//     });
//     con.end();
// }


//adds a member to database
function addMember(first_name, last_name, email, year) {
    con.connect(function (err) {
        if (err) throw err;
        var sql = "INSERT INTO members (first_name, last_name, email, year) VALUES ('" + first_name + "', '" + last_name + "', '" + email + "', " + year + ")";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log(first_name + " " + last_name + " added to members");
        });
        con.end();
    });
}