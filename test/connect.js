var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "pets",
    port: 3306
});

function connect() {
    console.log("Connect attemp:")
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
}

function test(){
    console.log("Tested");
}