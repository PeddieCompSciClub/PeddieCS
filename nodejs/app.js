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

// Read in the contents of the secure.json file
const secureData = fs.readFileSync('secure.json');
const secure = JSON.parse(secureData);

//transporter to send emails with (for security reasons auth is held in a seperate json)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: secure.email.user,
        pass: secure.email.pass
    }
});



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
    const username = email.substring(0, email.lastIndexOf("@"));

    if (email.endsWith("@peddie.org") && validator.validate(email)) {

        // Save image file if it exists
        if (req.body.image) {
            const image = req.body.image;
            // Create a buffer from the base64-encoded string
            const buffer = Buffer.from(image, 'base64');
            // Write the buffer to a file
            fs.writeFile(`../members/user-images/${username}`, buffer, function (err) {
                if (err) {
                    console.log(err);
                    res.send({ message: 'failed' });
                } else {
                    console.log(`Image saved as ${username}`);
                }
            });
        }


        const body = `
            <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
            <h4>Verify Your Account:</h4>
            <div class="memberItem">
                <img src="cid:user"  alt="Image not found" onError="this.onerror=null;this.src='https://peddiecs.peddie.org/memebers/user-images/missing.jpg';">
                <a>${firstName} ${lastName}</a>
            </div>
            `;

        const mailOptions = {
            from: 'compsciclub@peddie.org',
            to: 'tchevres-24@peddie.org',
            subject: 'PeddieCS Verify Registration: ',
            attachments: [{
                filename: username,
                path: '../members/user-images/'+username,
                cid: 'user'
            }],
      
            html: body
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
                console.log("error code 41");
            } else {
                console.log('Email Sent: ' + info.response);

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



