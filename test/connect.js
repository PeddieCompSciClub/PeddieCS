var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "pets",
    port: 3306
});

function connect() {
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
}

function test(){
    console.log("Tested");
}