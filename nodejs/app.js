const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const validator = require('email-validator');
const nodemailer = require("nodemailer");

//used to set port to listen on
const port = 5622;

const app = express();
// Increase the maximum allowed payload size to 50MB
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));





/*
 * The most important part of the code :), this tells express to listen on port 5622 of the local host
 * (our proxy will route the requests to us, if you need a refresher on that just look through the docs)
 */
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
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



app.get('/getAllMembers', (req, res) => {
    var con = mysql.createConnection({
        host: "localhost",
        user: "admincs",
        password: "BeatBlair1864",
        database: "peddieCS",
        port: 3306
    });

    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM members", function (err, result, fields) {
            if (err) throw err;
            res.json({ "error": false, "message": result });
            return res.end();
        })
        con.end();
    })
});

app.post('/addMember', function (req, res) {
    // Get member data from POST request
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;

    // Save image file if it exists
    if (req.body.image) {
        const image = req.body.image;
        // Create a buffer from the base64-encoded string
        const buffer = Buffer.from(image, 'base64');
        // Write the buffer to a file
        fs.writeFile(`../members/user-images/${email.substring(0, email.lastIndexOf("@"))}`, buffer, function (err) {
            if (err) {
                console.log(err);
                res.send({ message: 'failed' });
            } else {
                console.log(`Image saved as ${email.substring(0, email.lastIndexOf("@"))}`);
                res.send({ message: 'success' });
            }
        });
    } else {
        // If no image file was included in the request, just log the member data
        var text = (`Received member data for ${firstName} ${lastName} (${email})`);
        res.send({ message: 'success' + text });
    }
});


//send an email confirmation for updating user info (saves image)
app.post('/confirmMember', function (req, res) {
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;

    if (email.endsWith("@peddie.org") && validator.validate(email)) {

        // Save temp image file if it exists
        if (req.body.image) {
            const image = req.body.image;
            // Create a buffer from the base64-encoded string
            const buffer = Buffer.from(image, 'base64');
            // Write the buffer to a file
            fs.writeFile(`../members/user-images/temp/${email.substring(0, email.lastIndexOf("@"))}`, buffer, function (err) {
                if (err) {
                    console.log(err);
                    res.send({ error: 'true', message: err });
                } else {
                    console.log(`Image saved as ${email.substring(0, email.lastIndexOf("@"))}`);
                }
            });
        } else {
            // If no image file was included in the request, just log the member data
            var text = (`Received member data for ${firstName} ${lastName} (${email})`);
            res.send({ error: 'false', message: text });
        }

        //send verification email
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'compsciclub@peddie.org',
                pass: '@peddie0225'
            }
        });

        var mailOptions = {
            from: 'compsciclub@peddie.org',
            to: email,
            subject: 'PeddieCS Verify',
            text: 'test\n' + email
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              res.send({error:'true', message:error});
            } else {
              console.log('Email sent: ' + info.response);
            }
          });


    } else {
        res.send({ error: 'true', message: 'Email Invalid' })
    }
});


// test to make sure it is working
app.get('/', (req, res) => {
    res.send('Hello World!');
});