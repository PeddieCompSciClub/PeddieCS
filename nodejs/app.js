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

console.log("RUN")

addMember();

function read() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        con.query("SELECT * FROM members", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
}

function addMember() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "INSERT INTO members (first_name, last_name, email, year) VALUES ('Tomaz', 'Chevres', 'tchevres-24@peddie.org', 2024)";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    });
}