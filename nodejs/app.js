const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const validator = require('email-validator');
const nodemailer = require("nodemailer");
// const sharp = require('sharp');

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


//return a random string of a given length using the given character set
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

//read an email at return the year
function getEmailYear(email) {
    const yearMatch = email.match(/\d{2}(?=@peddie\.org)/);
    if (yearMatch) {
        const year = parseInt(yearMatch[0]) + 2000;
        return year;
    } else {
        return 0;
    }
}

//returns the username from email
function getUsername(email) {
    return email.substring(0, email.indexOf("@"));
}

//returns the current graduation year
function getCurrentYear() {
    const d = new Date();
    let year = d.getFullYear() + (d.getMonth() > 6 ? 1 : 0);
    return year;
}

//return the name, year, and email of all saved members
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
        con.query("SELECT first_name, last_name, email, year FROM members WHERE public>=1", function (err, result, fields) {
            if (err) throw err;
            res.json({ "error": false, "message": result });
            return res.end();
        })
        con.end();
    })
});

//Returns all of a member's (public) data. (name, year, projects, articles, etc.)
app.get('/getMemberData', (req, res) => {
    email = req.query.email;
    console.log(email);
    var member;//json containing member's info

    var con = mysql.createConnection({
        host: "localhost",
        user: "admincs",
        password: "BeatBlair1864",
        database: "peddieCS",
        port: 3306
    });

    if (email) {
        con.connect(function (err) {
            if (err) throw err;

            con.query(`SELECT * FROM members WHERE email = '${email}'`, function (err, result, fields) {
                if (err) throw err;
                if (result.length > 0) {
                    member = result[0];


                    //get user's project info
                    con.query(`SELECT * FROM projects WHERE REPLACE(contributors, ' ', '') LIKE '%"email":"${email}"%'`, function (err, result, fields) {
                        if (err) throw err;
                        for (var i = 0; i < result.length; i++) {
                            //result[i].contributors is saved as a jsonArray, but needs to be parsed (also sorted)
                            //look into new versions for MariaDB to support acutal JSON datatypes?
                            var json = JSON.parse(result[i].contributors);
                            json.contributors.sort(function (a, b) {
                                if (a.priority === undefined && b.priority === undefined) {
                                    return 0;
                                } else if (a.priority === undefined) {
                                    return 1;
                                } else if (b.priority === undefined) {
                                    return -1;
                                } else {
                                    return a.priority - b.priority;
                                }
                            });
                            result[i].contributors = json.contributors;
                        }
                        //sort projects in order of date
                        result.sort(function (a, b) {
                            var dateA = new Date(a.publish_date);
                            var dateB = new Date(b.publish_date);
                            if (dateA > dateB) {
                                return -1;
                            } else if (dateA < dateB) {
                                return 1;
                            } else {
                                return 0;
                            }
                        });
                        if (result) member.projects = result;

                        //get user's article info
                        con.query(`SELECT * FROM articles WHERE REPLACE(contributors, ' ', '') LIKE '%"email":"${email}"%'`, function (err, result, fields) {
                            if (err) throw err;
                            for (var i = 0; i < result.length; i++) {
                                //result[i].contributors is saved as a jsonArray, but needs to be parsed (also sorted)
                                //look into new versions for MariaDB to support acutal JSON datatypes?
                                var json = JSON.parse(result[i].contributors);
                                json.contributors.sort(function (a, b) {
                                    if (a.priority === undefined && b.priority === undefined) {
                                        return 0;
                                    } else if (a.priority === undefined) {
                                        return 1;
                                    } else if (b.priority === undefined) {
                                        return -1;
                                    } else {
                                        return a.priority - b.priority;
                                    }
                                });
                                result[i].contributors = json.contributors;
                            }
                            //sort projects in order of date
                            result.sort(function (a, b) {
                                var dateA = new Date(a.publish_date);
                                var dateB = new Date(b.publish_date);
                                if (dateA > dateB) {
                                    return -1;
                                } else if (dateA < dateB) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });
                            if (result) member.articles = result;
                            res.json(member);
                            return res.end();
                            con.end();
                        });
                    });
                } else {
                    res.json({ "message": "user not found" });
                    return res.end();
                }
            });
        });
    } else {
        res.json({ "message": "email invalid" });
        return res.end();
    }
});


// test to make sure it is working
app.get('/', (req, res) => {
    res.send('Hello World!');
});


//login with google stuff
app.post('/authenticateUser', (req, res) => {
    const token = req.body.token;

    const CLIENT_ID = secure.google.clientId;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(CLIENT_ID);
    async function verify() {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: CLIENT_ID
            });
            const payload = ticket.getPayload();
            console.log(payload);

            if (payload['hd'] != 'peddie.org') {
                res.json({ "message": "failed", "credential": payload });
                res.end();
            } else {

                //check if the user is already registered in the database
                var con = mysql.createConnection({
                    host: "localhost",
                    user: "admincs",
                    password: "BeatBlair1864",
                    database: "peddieCS",
                    port: 3306
                });
                con.connect(function (err) {
                    if (err) throw err;
                    con.query(`SELECT first_name, last_name, email, year, permissions FROM members WHERE email = '${payload['email']}'`, function (err, result, fields) {
                        if (err) throw err;
                        if (result.length > 0) {
                            res.json({ "message": "success", "credential": payload, "user": result[0] });
                            res.end();
                        } else {
                            res.json({ "message": "new-user", "credential": payload });
                            res.end();
                        }
                    });
                    con.end();
                })
            }

        } catch (error) {
            console.error(error);
            res.json({ "message": "failed" });
            res.end();
        }
    }
    verify().catch(console.error);
});

//add member from google user credential
app.post('/addMember', function (req, res) {
    const token = req.body.token;

    const CLIENT_ID = secure.google.clientId;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(CLIENT_ID);
    async function verify() {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: CLIENT_ID
            });
            const payload = ticket.getPayload();
            //check that it is a peddie user
            if (payload['hd'] != 'peddie.org') {
                res.json({ "message": "failed" });
                res.end();
            } else {
                //check if the user is already registered in the database
                var con = mysql.createConnection({
                    host: "localhost",
                    user: "admincs",
                    password: "BeatBlair1864",
                    database: "peddieCS",
                    port: 3306
                });
                con.connect(function (err) {
                    if (err) throw err;
                    con.query(`SELECT * FROM members WHERE email = '${payload['email']}'`, function (err, result, fields) {
                        if (err) throw err;
                        if (result.length > 0) {
                            //the member should not already be in the database
                            res.json({ "message": "success" });
                            res.end();
                            con.end();
                        } else {
                            //add member
                            con.query(`INSERT INTO members (first_name, last_name, email, year) VALUES ('${payload['given_name']}', '${payload['family_name']}', '${payload['email']}', ${getEmailYear(payload['email'])})`, function (err, result, fields) {
                                if (err) throw err;

                                res.json({ "message": "success" });
                                res.end();
                                con.end();
                            });
                        }
                    })

                })
            }


        } catch (error) {
            console.error(error);
            res.json({ "message": "failed" });
            res.end();
        }
    }
    verify().catch(console.error);
});

//updates the user's bio
app.post('/updateBio', (req, res) => {
    const token = req.body.token;
    const bio = req.body.bio;
    //verify credential
    verifyCredential(token, function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
        }
        else {
            console.log(email);
            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });
            con.query(`UPDATE members SET bio="${bio}" WHERE email="${email}"`, function (err, result, fields) {
                if (err) throw err;
                console.log(bio);
                res.json({ 'message': 'success' });
            });
        }
    });
});

//updates the user's bio
app.post('/updateUniversity', (req, res) => {
    const token = req.body.token;
    const uni = req.body.uni;
    //verify credential
    verifyCredential(token, function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
        }
        else {

            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });
            con.query(`UPDATE members SET university="${uni}" WHERE email="${email}" AND year = ${getCurrentYear()}`, function (err, result, fields) {
                if (err) throw err;
                // console.log(uni);
                res.json({ 'message': 'success' });
            });
        }
    });
});

//updates the user's profile visibilty
app.post('/updateVisibility', (req, res) => {
    const token = req.body.token;
    const oldVal = req.body.oldVal;
    if (oldVal != null) {
        var newVal = (oldVal <= 0 ? 1 : 0);
        //verify credential
        verifyCredential(token, function (success, email) {
            if (!success) {
                res.json({ 'message': 'failed' });
                res.end();
            }
            else {
                var con = mysql.createConnection({
                    host: "localhost",
                    user: "admincs",
                    password: "BeatBlair1864",
                    database: "peddieCS",
                    port: 3306
                });
                con.query(`UPDATE members SET public=${newVal} WHERE email="${email}"`, function (err, result, fields) {
                    if (err) throw err;
                    res.json({ 'message': 'success', 'newVal': newVal });
                    res.end();
                });
            }
        });
    } else {
        res.json({ 'message': 'failed' });
        res.end();
    }
});

//updates the user's profile image
app.post('/updateUserImage', (req, res) => {
    const token = req.body.token;
    const image = req.body.image;
    if (image) {

        verifyCredential(token, function (success, email) {
            if (!success) {
                res.json({ 'message': 'failed' });
                res.end();
            }
            else {
                const username = getUsername(email);
                const buffer = Buffer.from(image, 'base64');
                // Write the buffer to a file
                fs.writeFile(`../members/user-images/${username}`, buffer, function (err) {
                    if (err) {
                        console.log(err);
                        res.send({ error: 'true', message: 'Failed To Save Image' });
                    } else {
                        console.log(`Image saved as ${username}`);
                    }
                });
            }
        });
    }
});

//deletes a user's account
app.post('/deleteUser', (req, res) => {
    const token = req.body.token;
    verifyCredential(token, function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {
            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });
            con.query(`DELETE FROM members WHERE email="${email}"`, function (err, result, fields) {
                if (err) throw err;
                console.log('Deleted user ' + email);
                res.json({ 'message': 'success' });
                res.end();
            });
        }
    });
});


//admin tools
//return all member data
app.get('/admin/getAllMembers', (req, res) => {
    const token = req.query.token;
    verifyCredentialPermission(token, 'admin', function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {
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
        }
    });
});

//updates a users profile info
app.post('/admin/updateUserProfile', (req, res) => {
    const token = req.body.token;
    const userEmail = req.body.email;
    const bio = req.body.bio;
    const university = req.body.university;
    const public = req.body.public;

    verifyCredentialPermission(token, 'admin', function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {
            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });

            con.connect(function (err) {
                if (err) throw err;
                con.query(`UPDATE members SET public=${public}, bio="${bio}", university="${university}" WHERE email="${userEmail}"`, function (err, result, fields) {
                    if (err) throw err;
                    res.json({ "message": "success" });
                    return res.end();
                });
                con.end();
            })
        }
    });
});

//updates the user's profile image
app.post('/admin/updateUserImage', (req, res) => {
    const token = req.body.token;
    const userEmail = req.body.email;
    const image = req.body.image;
    if (image) {

        verifyCredentialPermission(token, "admin", function (success, email) {
            if (!success) {
                res.json({ 'message': 'failed' });
                res.end();
            }
            else {
                const username = getUsername(userEmail);
                const buffer = Buffer.from(image, 'base64');
                // Write the buffer to a file
                fs.writeFile(`../members/user-images/${username}`, buffer, function (err) {
                    if (err) {
                        console.log(err);
                        res.send({ error: 'true', message: 'Failed To Save Image' });
                    } else {
                        console.log(`Image saved as ${username}`);
                    }
                });
            }
        });
    }
});


//cs fellows
//schedules a cs fellow for a specific time slot
app.post('/csfellows/schedule', (req, res) => {
    const token = req.body.token;

    verifyCredentialPermission(token, 'csfellow', function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {
            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });

            con.connect(function (err) {
                if (err) throw err;
                con.query(`INSERT INTO csfellows (name, email, datetime) VALUES ('test', '${email}', '2023-05-17 20:00:00');`, function (err, result, fields) {
                    if (err) throw err;
                    res.json({ "message": "success" });
                    return res.end();
                });
                con.end();
            })
        }
    });
});

//gets the cs fellow for a specific month
app.get('/csfellows/schedule', (req, res) => {
    const date = new Date(req.query.date);
    const mysqlDate = date.getFullYear() + '-' + date.getMonth() + '-' + (date.getDate() + 1) + ' ' + date.getHours() + ':00:00';

    var con = mysql.createConnection({
        host: "localhost",
        user: "admincs",
        password: "BeatBlair1864",
        database: "peddieCS",
        port: 3306
    });
    con.connect(function (err) {
        if (err) throw err;
        console.log(`SELECT name, email, date, id FROM csfellows WHERE MONTH(date)=${date.getMonth() + 1}`);
        con.query(`SELECT name, email, date, id FROM csfellows WHERE YEAR(date)=${date.getFullYear()} AND MONTH(date)=${date.getMonth() + 1}`, function (err, result, fields) {
            if (err) throw err;
            res.json({ "message": "success", "schedule": result });
            return res.end();
        });
        con.end();
    });
});

//removes an event from the calendar
app.post('/csfellows/schedule/cancel', (req, res) => {
    const token = req.body.token;
    const id = req.body.id;

    verifyCredentialPermission(token, 'csfellow', function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {
            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });

            //var dateString = 
            con.connect(function (err) {
                if (err) throw err;
                //INSERT INTO csfellows (name, email, datetime) VALUES ('test', '${email}', '2023-05-17 20:00:00');
                console.log(`DELETE FROM csfellows WHERE email='${email}' AND id=${id}`)
                con.query(`DELETE FROM csfellows WHERE email='${email}' AND id=${id}`, function (err, result, fields) {
                    if (err) throw err;
                    res.json({ "message": "success" });
                    return res.end();
                });
                con.end();
            })
        }
    });
});

//removes an event from the calendar
app.post('/csfellows/schedule/month', (req, res) => {
    const token = req.body.token;
    const schedule = req.body.schedule;

    verifyCredentialPermission(token, 'admin', function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {

            var con = mysql.createConnection({
                host: "localhost",
                user: "admincs",
                password: "BeatBlair1864",
                database: "peddieCS",
                port: 3306
            });

            for (let i = 0; i < schedule.length; i++) {
                for (let j = 0; j < schedule[i].length; j++) {



                    var event = schedule[i][j];

                    const date = new Date(event.date);
                    const mysqlDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (i + 1) + ' ' + date.getHours() + ':00:00';
                    con.connect(function (err) {
                        if (err) throw err;
                        con.query(`INSERT INTO csfellows (name, email, date) VALUES ('${event.name}', '${event.email}', '${mysqlDate}');`, function (err, result, fields) {
                            if (err) throw err;
                            console.log(i, j, schedule[i][j]);
                            con.end();
                        });
                    });
                }
            }
        }
    });
});

function recursiveAdd(schedule, i, j) {
    console.log(i,j)
    var event = schedule[i][j];
    const date = new Date(event.date);
    const mysqlDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (i + 1) + ' ' + date.getHours() + ':00:00';
    
    con.connect(function (err) {
        if (err) throw err;
        con.query(`INSERT INTO csfellows (name, email, date) VALUES ('${event.name}', '${event.email}', '${mysqlDate}');`, function (err, result, fields) {
            if (err) throw err;
            console.log(i, j, schedule[i][j]);
            
            j = (j+1)%schedule[i].length;
            if(j==0) i++;
            if(i < schedule.length) recursiveAdd(schedule, i, j);
            else con.end();
        });
    });
}


//get zoom link
app.get('/csfellows/getZoomLink', (req, res) => {
    const token = req.query.token;
    verifyCredentialPermission(token, 'csfellow', function (success, email) {
        if (!success) {
            res.json({ 'message': 'failed' });
            res.end();
        }
        else {
            res.json({ 'message': 'success', 'link': secure.zoom.link });
            res.end();
        }
    });
});

//verify user credential and callbacks with email
function verifyCredential(token, callback) {
    const CLIENT_ID = secure.google.clientId;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(CLIENT_ID);
    async function verify() {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: CLIENT_ID
            });
            const payload = ticket.getPayload();

            if (payload['hd'] != 'peddie.org') {
                callback(false);
            } else {
                //check if the user is already registered in the database
                var con = mysql.createConnection({
                    host: "localhost",
                    user: "admincs",
                    password: "BeatBlair1864",
                    database: "peddieCS",
                    port: 3306
                });
                con.connect(function (err) {
                    if (err) throw err;
                    con.query(`SELECT email FROM members WHERE email = '${payload['email']}'`, function (err, result, fields) {
                        if (err) throw err;
                        if (result.length > 0) {
                            callback(true, payload['email']);
                        } else {
                            callback(false);
                        }
                    });
                    con.end();
                })
            }

        } catch (error) {
            console.error(error);
            callback(false);
        }
    }
    verify().catch(console.error);
}

//verifys admin credential & if a user has a specific permission
function verifyCredentialPermission(token, permission, callback) {
    const CLIENT_ID = secure.google.clientId;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(CLIENT_ID);
    async function verify() {
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: CLIENT_ID
            });
            const payload = ticket.getPayload();

            if (payload['hd'] != 'peddie.org') {
                callback(false);
            } else {
                //check if the user is already registered in the database
                var con = mysql.createConnection({
                    host: "localhost",
                    user: "admincs",
                    password: "BeatBlair1864",
                    database: "peddieCS",
                    port: 3306
                });
                con.connect(function (err) {
                    if (err) throw err;
                    con.query(`SELECT email FROM members WHERE email = '${payload['email']}' AND FIND_IN_SET('${permission}', permissions) > 0`, function (err, result, fields) {
                        if (err) throw err;
                        if (result.length > 0) {
                            callback(true, payload['email']);
                        } else {
                            callback(false);
                        }
                    });
                    con.end();
                })
            }

        } catch (error) {
            console.error(error);
            callback(false);
        }
    }
    verify().catch(console.error);
}
