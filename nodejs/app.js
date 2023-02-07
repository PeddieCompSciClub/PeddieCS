var mysql = require('mysql');
// var express = require('express');
// var router = express.Router();

var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieCS",
    port: 3306
});


/*
    Allows user to pass arguments through command line
    input:
    $ node app.js debug Tomaz Chevres tchevres-24@peddie.org 2024
    output:
    0 '/usr/bin/node'
    1 '/var/www/CSProjects/nodejs/app.js'
    2 'debug'
    3 'Tomaz'
    4 'Chevres'
    5 'tchevres-24@peddie.org'
    6 '2024'
*/
switch (process.argv[2]){
    case 'debug':
        process.argv.forEach((value, index) => {
            console.log(index, value);
        });  
        break;
    case 'addMember':
        addMember(process.argv[3],process.argv[4],process.argv[5],parseInt(process.argv[6]));
        break;
}

function read() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        con.query("SELECT * FROM members", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
    con.end();
}

function addMember(first_name, last_name, email, year) {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "INSERT INTO members (first_name, last_name, email, year) VALUES ('" + first_name + "', '" + last_name + "', '" + email + "', " + year + ")";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
        con.end();
        console.log("Ended");
    });
}