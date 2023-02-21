/**
 * This document contains all the node js for running the website backend
 * All the get and post requests are organized in alphabetical order
 * The code right below are our imports, to import something in nodejs you create a variable equal to the package name
 */

// all packages are explained in the google doc https://docs.google.com/document/d/1QGdBhQg6xaZMT3exE3cbbR5LAGDo_o8FUBRg0LJy-xg/edit
var mysql = require('mysql');
var validator = require("email-validator");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var redis = require('redis');
var session = require('express-session');
var client = redis.createClient();
var router = express.Router();
var nodemailer = require('nodemailer');
var mailGun = require('nodemailer-mailgun-transport');
var session = require('express-session'), redisStore = require('connect-redis')(session);
const multer = require('multer');
const { response } = require('express');
var fs = require('fs');
var que = [];
//image clipper requires nodejs canvas in
var Clipper = require('image-clipper');

Clipper.configure({
  canvas: require('canvas')
});

var url = require("url");
const jo = require('jpeg-autorotate');
const options = { quality: 100 }

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'ourKeyIsBeatBlair',
  cookie: { secure: false },//if doesnt work use cookie-parser
  saveUninitialized: false,
  resave: false,
  store: new redisStore({ host: 'localhost', port: 6379, client: client, ttl: 1800 })
}));

var useMulter = multer();

/**
 * Random alphanumeric string generator for salt and verification
 */

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
function containsOnlyLetters(checkString) {

  for (var i = 0; i < checkString.length; i++) {
    if (!(checkString.charCodeAt(i) >= 65 && checkString.charCodeAt(i) <= 90) && !(checkString.charCodeAt(i) >= 97 && checkString.charCodeAt(i) <= 122)) {
      return false;
    }
  }
  return true;
}
function checkPassword(password) {
  var hasSpecChar = false;//default states
  var hasUpperCase = false;
  var hasLowerCase = false;
  var noBadCharacters = true;
  var hasNumber = false;
  for (var i = 0; i < password.length; i++) {
    if (password.length > 9) {
      if ((password.charCodeAt(i) >= 33 && password.charCodeAt(i) <= 47) ||
        (password.charCodeAt(i) >= 58 && password.charCodeAt(i) <= 64) ||
        (password.charCodeAt(i) >= 91 && password.charCodeAt(i) <= 96) ||
        (password.charCodeAt(i) >= 123 && password.charCodeAt(i) <= 127)) {

        hasSpecChar = true;
      }
      else if (password.charCodeAt(i) >= 48 && password.charCodeAt(i) <= 57) {
        hasNumber = true;
      }
      else if ((password.charCodeAt(i) >= 65 && password.charCodeAt(i) <= 90)) {
        hasUpperCase = true;
      }
      else if ((password.charCodeAt(i) >= 97 && password.charCodeAt(i) <= 122)) {
        hasLowerCase = true;
      } else {
        noBadCharacters = false;
        break;
      }
    }
  }
  if (hasSpecChar && hasLowerCase && hasUpperCase && noBadCharacters && hasNumber) {
    return true;
  } else {
    return false;
  }
}

function inQue(currImage) {
  console.log(que.length);
  console.log(currImage);
  for (var i = 0; i < que.length; i++) {
    console.log(que[i]);
    if (que[i] == currImage) {
      return true;
    }
  }
  return false;
}
function removeFromQue(currImage) {
  for (var i = 0; i < que.length; i++) {
    if (que[i] == currImage) {
      que.splice(i, 1);
    }
  }
}
function shrinkArray(array, maxLen) {

  if (array.length > maxLen) {
    array.splice(0, 1);//note this is a function, doesn't return a string output!
    shrinkArray(array, maxLen);
  }
  return array;
}
function addToFile(error, body, file, code) {

  var string = "error: ";
  string += JSON.stringify(error).replace(/(\r\n|\n|\r)/gm, "");
  string += "\n";

  if (file && file.length > 0 && !(file[0] == null)) {
    string += " file fields: ";
    string += " mimetype: " + file[0].mimetype;
    string += " originalname " + file[0].originalname;
    string += " fieldname: " + file[0].fieldname;
    string += " encoding: " + file[0].encoding;
    string += " size: " + file[0].size;
    string += " end of file ";
    string += "\n";
  }
  string += " body variables: ";
  string += JSON.stringify(body);
  string += " end of body variables ";
  var date = new Date();
  string += "\n";
  string += " date and time " + date;
  string += "\n";
  string += "error code " + code;
  console.log("down here");
  console.log(string);
  fs.appendFile('errorlog.txt', '\n' + string, (err) => {
    if (err) {
      console.log(err);
      console.log("error writing to error file lol error ^");
      return;
    }
    fs.readFile('errorlog.txt', 'utf-8', (err, data) => {
      if (err) {
        console.log("error log has been corrupted :/ ");
      } else {
        var arrayOfLinesInFile = [];
        arrayOfLinesInFile = data.split('\n');
        var maxLogLength = 200;
        if (arrayOfLinesInFile.length > maxLogLength) {
          fs.writeFile('errorlog.txt', shrinkArray(arrayOfLinesInFile, maxLogLength).join('\n'), (err) => {
            if (err) {
              console.log("failed on change maxlen");
            }
          });
        }
      }
    });
  });
}
function checkSubj(req, sortMethod) {
  if (req.session.subjValue && req.session.subjValue != "") {
    return "SELECT * FROM Book_List WHERE Subject=\"" + req.session.subjValue + "\"" + sortMethod;
  }
  return "SELECT * FROM Book_List" + sortMethod;
}
function clearSubjAndOrderMethod(req) {
  req.session.subjValue = "";
  req.session.orderMethod = "";
}
function turnApostrophesIntoAsteriks() {

}
// Get Requests stored here, these expect and read a response; 
/**
 * Basic request will redirect to login
 * writes a response back to client telling them to go to login
 */
router.get('/', function (req, res) {
  console.log('reached general redirect (also a get request) ');
  res.writeHead(302, { Location: 'https://exchange.peddie.org/login.html' });
  return res.end();
});

/**
 * used for page.html, user is redirected there after clicking more info and then page.html looks at session variables through this get request 
 * to see what book the user looked at. 
 */
router.get('/getBookData', function (req, res) {
  console.log("redirected to get book data get request");

  if (req.session.title) {
    res.json({
      "title": req.session.title, "price": req.session.price, "condition": req.session.condition,
      "class": req.session.class, "ISBN": req.session.ISBN, "email": req.session.pageEmail, "image": req.session.image, "subject": req.session.subject, "state": req.session.state
    });
  }
  return res.end();
});

/**
 * Returns the entire booklist, this is designed to be used for keystroke searches(might move the algorithim here)
 * Basically just querrys the book list and sets that to the response json(mysql responses from querry's are json files so we can send that easily
 * to the client) and then parse it client side
 */
router.get('/getBookList', function (req, res) {
  console.log("redirected to get book list get request");
  if (req.session.email && req.session.loggedIn == true) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });
    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number sixteen");
          console.log(err);
          addToFile(err, req.body, req.files, 16);
          res.json({ "message": "error code #16, if this error persists please report it to a member of our team!" });

          con.end();
          return res.end();
        }
        console.log("opened connection in book price load");

        var str = "SELECT * FROM bookListSpring2018;";

        con.query(str, function (err, result) {
          if (err) {
            console.log("error number seventeen");
            console.log(err);
            addToFile(err, req.body, req.files, 17);
            res.json({ "message": "error code #17, if this error persists please report it to a member of our team!" });

            con.end();
            return res.end();
          }
          //console.log(result);
          for (var i = 0; i < result.length; i++) {

          }
          res.json(result);
          res.end();
          con.end();
        });
      });

    } catch (err) {
      console.log("error number fifty three");
      console.log(err);
      addToFile(err, req.body, req.files, 53);
      res.json({ "error": "true", "message": "error code #53, if this error persists please report it to a member of our team!" });

      return res.end();
    }
  }
  else {

  }
});

/**
 * Returns the name and email of the client(via session variables), this is used for the my-account page. we querry the users database via
 * email session var adn then send back the result json(same using mysql json result)
 */
router.get('/getNameAndEmail', function (req, res) {
  if (req.session.email && req.session.loggedIn == true) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });
    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number eighteen");
          console.log(err);
          addToFile(err, req.body, req.files, 18);
          res.json({ "message": "error code #18, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        console.log("opened connection in book price load");

        var str = "SELECT * FROM users WHERE email=" + "\"" + String(req.session.email) + "\";";

        con.query(str, function (err, result) {
          if (err) {
            console.log("error number ninteen");
            console.log(err);
            addToFile(err, req.body, req.files, 19);
            res.json({ "message": "error code #19, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          res.json(result);
          res.end();
          return con.end();
        });
      });
    } catch (e) {

      console.log(e);
      console.log("error number one");
      addToFile(err, req.body, req.files, 1);
      res.json({ "message": "error code #1, if this error persists please report it to a member of our team!" });
      con.end();
      return res.end();


    }
  }
});

//redirects the user to the login page, simple function(currently using 302 html requests because it doesn't cache, 301 redirects cache)
router.get('/goToLogin', function (req, res) {
  console.log("redirected to go to login get request");
  res.writeHead(302, { Location: 'https://exchange.peddie.org/login.html' });
  return res.end();
});

router.get('/isAdmin', function (req, res) {
  console.log("redirected to is admin get request");
  if (req.session.email && req.session.admin == true) {

  }
});
/**
 * checks session variable to see if the user is logged in, we use this to make sure that clients can't access certain pages w/ out 
 * being logged in
 */
router.get('/login', function (req, res) {
  console.log("redirected to login get request");
  if (req.session.email && req.session.loggedIn == true) {
    console.log("logged in");
    res.json({ "error": false, "message": "Welcome!" });
    res.end();
  } else {
    console.log("not logged in from get login");
    res.json({ "error": true, "message": "Please Login First!" });
    res.end();
  }
});

//Log's out the user by destroying their current session(they will create a new one when they login), they are then redirected back to login
router.get('/logout', function (req, res) {
  console.log("redirected to logout get request");
  if (req.session.loggedIn == true) {
    req.session.destroy(function () {
      res.redirect('https://exchange.peddie.org/login.html')
      return res.end()
    });
  } else {
    res.redirect('https://exchange.peddie.org/login.html')
    return res.end()
  }
});

/**
 * This is used by all the pages under sellbook(sellerpage, editbook, removebook etc). Shows the books of the client based on their session 
 * variables. basically we open a connection and then querry book list based on email and then send the result
 */
router.get('/showClientsBooks', function (req, res) {
  console.log("redirected to show client books get request");
  if (req.session.email && req.session.loggedIn == true) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });
    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number twenty");

          console.log(err);
          addToFile(err, req.body, req.files, 20);
          res.json({ "error": "true", "message": "error code #20, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        console.log("opened connection in book price load");

        var str = "SELECT * FROM Book_List WHERE email=" + "\"" + String(req.session.email) + "\";";

        con.query(str, function (err, result) {
          if (err) {
            console.log("error number twenty one");
            console.log(err);
            addToFile(err, req.body, req.files, 21);
            res.json({ "error": "true", "message": "error code #21, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          //console.log(result);
          res.json(result);
          res.end();
          con.end();
        });
      });

    } catch (e) {
      console.log("error number fifty two");
      console.log(e);
      addToFile(err, req.body, req.files, 52);
      res.json({ "error": "true", "message": "error code #52, if this error persists please report it to a member of our team!" });

      return res.end();
    }
  }
  else {

  }

});


/**
 * this is the redirect for email verification, when a client registers we send them a link that links them to this page. The verificationNumber thing 
 * after the colon is a variable and it allows us to look for all requests that contain verificationSite(to break this down a little better if we didn't
 * have the colon this request would look for requests to https://exchange.peddie.org/nodejs/verificationSite/verificationNumber) but with the colon
 * express considers it a variable and listens for reuquests to https://exchange.../verificationSite and we can then parse the url to get the 
 * verification number and confirm that the client does indeed have a valid email. So basically we use the url library to parse the request and get 
 * out the verification number(it was originally a number but now it is an alphanumeric string) and we then querry the database based on that 
 * variable. If the verification number is in the database we confirm that the client's email is vaild becasue they clicked a link with a valid
 * verification number. When then insert them into the user's database and remove them from the temporary registration database
 */
router.get('/verificationSite/:verificationNumber', function (req, res) {
  console.log('reached get request verification site');
  var pathname = url.parse(req.url).pathname;
  console.log('path name reached');
  console.log(pathname);
  verificationNum = pathname.substring(pathname.indexOf(':') + 1);
  console.log(verificationNum);

  var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieBookExchange",
    port: 3306
  });
  try {
    con.connect(function (err) {
      if (err) {
        console.log("error number twenty two");
        console.log(err);
        addToFile(err, req.body, req.files, 22);
        res.json({ "error": "true", "message": "error code #22, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      console.log('opened connection to verification');
      var verificationQuery = "SELECT * FROM verification WHERE verification_number=" + "\'" + verificationNum + "\'" + ";";
      con.query(verificationQuery, function (err, result) {
        if (err) {
          console.log(err);
          console.log("error number two");
          addToFile(err, req.body, req.files, 2);
          res.json({ "error": "true", "message": "error code #2 , if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        if (result.length > 0) {
          console.log('second way');
          console.log(result[0].first_name);
          var addUser = "INSERT INTO `users` (`first_name`, `last_name`, `email`, `password`,`salt`) VALUES ";
          var addUser2 = addUser + "(" + "\'" + result[0].first_name + "\', " + "\'" + result[0].last_name + "\', " + "\'" +
            result[0].email + "\'," + "\'" + result[0].password + "\'," + "\'" + result[0].salt + "\'" + ");";
          var deleteUser = "DELETE FROM verification WHERE email = '" + result[0].email + "\';";
          //adds user to the users table
          con.query(addUser2, function (err, result) {
            if (err) {
              console.log(err);
              console.log("error number three");
              addToFile(err, req.body, req.files, 3);
              res.json({ "error": "true", "message": "error code #3, if this error persists please report it to a member of our team!" });
              con.end();
              return res.end();
            }
            //deletes user to the temporary verification table
            con.query(deleteUser, function (err, result) {
              if (err) {
                console.log(err);
                console.log("error number four");
                res.json({ "message": "error code #4, if this error persists please report it to a member of our team!" });
                con.end();
                return res.end();
              }
              res.writeHead(302, { Location: 'https://exchange.peddie.org/verification.html' });
              con.end();
              return res.end();
            });
          });

        }
        else {
          res.json("Link invalid");
          console.log("this did not work");
          con.end();
          return res.end();
        }
      });
    });
  }
  catch (err) {
    console.log("error number fifty four");
    console.log(err);
    addToFile(err, req.body, req.files, 54);
    res.json({ "error": "true", "message": "error code #54, if this error persists please report it to a member of our team!" });

    return res.end();
  }
});

//post requests here, these send info which can be downloaded or added to the server 

/**
 * This request simply takes in fields from the body and then inserts them into the databse to add a book(image handling is done elsewhere)
 */
router.post('/addbook', function (req, res) {
  console.log("redirected to add book post request");
  if (req.session.email && req.session.loggedIn == true) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });
    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number twenty three");
          console.log(err);
          addToFile(err, req.body, req.files, 23);
          res.json({ "error": "true", "message": "error code #23, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        console.log("opened connection");
        var price = parseFloat(req.body.Price);
        console.log(req.body.Price);
        var email = req.session.email;

        var sql = "INSERT INTO `Book_List` (`ISBN`, `Title`, `Class`,`price`, `BookCondition`, `Subject`, `Email`,`Image`) VALUES ";
        var str = sql + "(" + "\'" +
          req.body.ISBN.replace(/ /g, "_") + "\', " + "\'" +
          req.body.Title.replace(/ /g, "_") + "\', " + "\'" +
          req.body.Class.replace(/ /g, "_") + "\', " + "\'" +
          req.body.Price + "\', " + "\'" +
          req.body.BookCondition.replace(/ /g, "_") + "\', " + "\'" +
          req.body.Subject.replace(/ /g, "_") + "\', " + "\'" +
          String(req.session.email) + "\', " + "\'" +
          req.body.FileName.replace(/ /g, "_") + "\'" + ");";
        console.log(req.body.FileName.replace(/ /g, "_"));
        con.query(str, function (err, result) {
          if (err) {
            console.log("error number twenty four");
            console.log(err);
            addToFile(err, req.body, req.files, 24);
            res.json({ "error": "true", "message": "error code #24, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          console.log("1 record inserted and ");
          con.end();
          if (req.body.responseType == 'add') {
            res.json({ "message": "sucessfully added book!" });
          }
          else if (req.body.responseType == 'edit') {
            res.json({ "message": "sucessfully edited book!" });
          }
          console.log("all fields go!");
          return res.end();
        });

      });
    } catch (err) {
      //maybe do response json 
      console.log("error number fifty five");
      console.log(err);
      addToFile(err, req.body, req.files, 55);
      res.json({ "error": "true", "message": "error code #55, if this error persists please report it to a member of our team!" });

      return res.end();
    }
  } else {
    console.log("not logged in");
    res.json({ "error": true, "message": "Please Login First!" });
    return res.end();
  }
});


/**
 * For forgot password. The concept here is similar to verification but the verification number is in the body instead of the link. We run a querry
 * here to make sure that the verification nubmer is indeed in the passwordReste database(the temp database for resetting password) and if it 
 * is then we make sure the passwords match(password and confirm password). If this is true then we update the salt and the password to our new
 * values(see documentation on google for more explanaiton of what a salt is). After adding this we remove the clients verification number from 
 * the forogt password database as they have successfuly reset their password.  
 */
router.post('/changePassword', function (req, res) {
  console.log('reached post request reset password verification');
  var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieBookExchange",
    port: 3306
  });
  try {
    con.connect(function (err) {
      if (err) {
        console.log("error number twenty five");
        console.log(err);
        addToFile(err, req.body, req.files, 25);
        res.json({ "error": "true", "message": "error code #25, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      console.log('Connected to change password site');
      var str = "SELECT * FROM passwordReset WHERE verificationNumber =\'" + req.body.verificationNumber + "\';";
      con.query(str, function (err, result) {
        if (err) {
          console.log("error number five");
          console.log(err);
          addToFile(err, req.body, req.files, 5);
          res.json({ "error": "true", "message": "error code #5, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        if (result.length > 0) {
          console.log('verification number matched');
          if (result.length > 0 && (req.body.newPassword === req.body.newPasswordConfirm) && checkPassword(req.body.newPassword)) {
            var salt = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyz');
            var str2 = "UPDATE users SET salt = \'" + salt + "\' WHERE email = \'" + result[0].email + "\'";
            con.query(str2, function (err, result2) {
              if (err) {
                console.log("error number twenty six");
                console.log(err);
                addToFile(err, req.body, req.files, 26);
                res.json({ "error": "true", "message": "error code #26, if this error persists please report it to a member of our team!" });
                con.end();
                return res.end();
              }
              str3 = "UPDATE users SET password = PASSWORD(\'" + salt + req.body.newPassword + "\') WHERE email =\'" + result[0].email + "\';";
              con.query(str3, function (err, result3) {
                if (err) {
                  console.log("error number six");
                  console.log(err);
                  addToFile(err, req.body, req.files, 6);
                  res.json({ "error": "true", "message": "error code #6, if this error persists please report it to a member of our team!" });
                  con.end();
                  return res.end();
                }
                str4 = "DELETE FROM passwordReset WHERE email = \'" + result[0].email + "\';";
                con.query(str4, function (err, result4) {
                  if (err) {
                    console.log("error twenty seven");
                    addToFile(err, req.body, req.files, 27);
                    res.json({ "error": "true", "message": "error code #27, if this error persists please report it to a member of our team!" });
                    con.end();
                    return res.end();
                  }
                  res.json({ "error": false, "message": "Password changed successfully" });

                  con.end();
                  return res.end();
                })

              });
            });
          }
          else {
            console.log('passwords do not match');
            con.end();
            return res.end();
          }
        }
        else {
          console.log('verification number does not exist');
          res.json({ "error": true, "message": "Your link is invalid, please request a new link" });
          con.end();
          return res.end();
        }
      });
    });
  }
  catch (err) {
    console.log("error number fifty six");
    console.log(err);
    addToFile(err, req.body, req.files, 56);
    res.json({ "error": "true", "message": "error code #56, if this error persists please report it to a member of our team!" });

    return res.end();
  }
});
/**
 * Simply deletes a users book from the database based on several fields to ensure we delete the right book. We have a varialbe to determine 
 * whether or not we want to delete the image as well(fs.unlickSync deletes file synchronously(yes i made this before i knew about callbacks 
 * and stuff)). This is used for editing a book because we use the same delete and addbook function for edit book, but if the client chooses
 * not to edit the image then we have to ensure that we dont' delete it.  We then redirect them back to the sellerpage
 */
router.post('/deleteABook', function (req, res) {
  console.log("reached delete book post request");
  console.log(req.body);
  console.log("here");
  if (req.session.loggedIn == true && req.session.email == req.body.bookEmail) {
    console.log("conditions met");
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });

    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number seven");
          console.log(err);
          res.json({ "error": "true", "message": "error code #7, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }

        var str = "DELETE FROM Book_List WHERE Image=\"" + req.body.bookImage + "\";";
        var str2 = "DELETE FROM Book_List_Pending WHERE Image=\"" + req.body.bookImage + "\";";
        var str3 = "DELETE FROM Book_List_Sold WHERE Image=\"" + req.body.bookImage + "\";";

        con.query(str2, function (err, result) {
          if (err) {
            console.log("error number eight");
            console.log(err);
            res.json({ "error": "true", "message": "error code #8, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
        });
        con.query(str3, function (err, result) {
          if (err) {
            console.log("error number sixty four");
            console.log(err);
            addToFile(err, req.body, req.files, 64);
            res.json({ "error": "true", "message": "error code #64, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
        });
        console.log(str);
        con.query(str, function (err, result) {
          if (err) {
            console.log("error number sixty five");
            console.log(err);
            addToFile(err, req.body, req.files, 65);
            res.json({ "error": "true", "message": "error code #65, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          console.log("succesfully deleted");
          try {
            if (req.body.deleteImage == true || req.body.deleteImage == 'true') {
              var pathToImage = '/var/www/PeddieBookExchange/userBookImages/' + req.body.bookImage;
              console.log(pathToImage);
              console.log("hey");
              fs.unlink(pathToImage, function (error) {
                if (error) {
                  addToFile(err, req.body, req.files, 28);
                  res.json({ "error": "true", "message": "there was an error deleting this book or this book doesn't have an image (code #28), if the issue persists please message a member of our team!" });
                  console.log(error);
                  console.log("error deleting book, code 28");
                  con.end();
                  return res.end();
                }
                res.json({ "message": "sucessfully deleted book!" });
                console.log("sucessfully deleted the book");
                con.end();
                return res.end();
              });



            } else {
              console.log("didn't fail but delete Image is false or doesn't exist");
              return res.end();
            }
          } catch (e) {
            console.log("couldn't delete file!");
            console.log(pathToImage);
            res.json({ "message": "there was an error deleting this book" });
            con.end();
            return res.end();
          }

        });
      });
    } catch (e) {
      res.writeHead(302, { Location: 'https://exchange.peddie.org/Sellerpage.html' });
      con.end();
      return res.end();
    }
  } else {
    console.log("email != user email || not logged in? ");
  }
});

/**
 * This is used for if a client wants to edi their name. We delete their old entry in users and then use the body variables for their password 
 * and email and the new name that they want to use(submitted via front end to body) 
 */
router.post('/editName', function (req, res) {
  console.log("reached edit name post request");
  if (req.session.loggedIn == true) {
    console.log("conditions met");
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });

    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number nine");
          console.log(err);
          res.json({ "error": "true", "message": "error code #9, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }


        var str2 = "";
        if (containsOnlyLetters(req.body.firstName) && containsOnlyLetters(req.body.lastName)) {
          if (req.body.firstName.length > 0) {
            str2 += "UPDATE users SET first_name = \'" + req.body.firstName + "\'";
            if (req.body.lastName.length > 0) {
              str2 += ", last_name = \'" + req.body.lastName + "\' WHERE email = \'" + req.session.email + "\';";
            }
            else {
              str2 += " WHERE email = \'" + req.session.email + "\';";
            }
          }
          else if (req.body.lastName.length > 0) {
            str2 += "UPDATE users SET last_name = \'" + req.body.lastName + "\' WHERE email = \'" + req.session.email + "\';";;
          }
        } else {
          con.end();
          res.json({ "message": "make sure your name only contains letters" });
          return res.end();
        }
        console.log(str2);
        if (str2.length > 0) {
          con.query(str2, function (err, result) {
            if (err) {
              addToFile(err, req.body, req.files, 29);
              res.json({ "error": "true", "message": "there was an error changing your name(code #29), if the issue persists please message a member of our team" });
              console.log(err);
              console.log("name changed failed, code twenty nine");
              res.end();
              con.end();

            };
            console.log("name changd suceeded");
            res.json({ "message": "your name has sucessfully been changed" });
            con.end();
            return res.end();
          });
        }


      });
    } catch (err) {
      console.log("error number fifty seven");
      console.log(err);
      addToFile(err, req.body, req.files, 57);
      res.json({ "error": "true", "message": "error code #57, if this error persists please report it to a member of our team!" });

      return res.end();
    }
  } else {
    console.log("email != user email || not logged in? ")
  }
});

/**
 * edit password has not been confirmed to work yet
 */

router.post('/editPassword', function (req, res) {
  console.log("reached editPassword post request");
  if (req.session.loggedIn == true) {
    console.log("conditions met");
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });
    try {

      con.connect(function (err) {
        if (err) {
          console.log("error number thirty");
          console.log(err);
          addToFile(err, req.body, req.files, 30);
          res.json({ "error": "true", "message": "error code #30, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        var str = "SELECT *FROM users WHERE email = \'" + req.session.email + "\';"

        con.query(str, function (err, result1) {
          if (err) {
            console.log("error number thirty one");
            console.log(err);
            addToFile(err, req.body, req.files, 31);
            res.json({ "error": "true", "message": "error code #31, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          var str2 = "SELECT *FROM users WHERE email = \'" + req.session.email + "\' AND password = PASSWORD(\'" + result1[0].salt + req.body.oldPassword + "\');";
          con.query(str2, function (err, result) {
            if (err) {
              console.log("error number fifty");
              console.log(err);
              res.json({ "error": "true", "message": "error code #50, if this error persists please report it to a member of our team!" });
              con.end();
              return res.end();
            }
            if (result.length > 0 && (req.body.newPassword === req.body.newPasswordConfirm) && checkPassword(req.body.newPassword)) {
              console.log("Password matched");
              str3 = "DELETE FROM users WHERE email = \'" + req.session.email + "\' AND password = PASSWORD(\'" + result1[0].salt + req.body.oldPassword + "\');";
              con.query(str3, function (err, result) {
                if (err) {
                  console.log("error number thirty two");
                  console.log(err);
                  addToFile(err, req.body, req.files, 32);
                  res.json({ "error": "true", "message": "error code #32, if this error persists please report it to a member of our team!" });
                  con.end();
                  return res.end();
                }
                var salt = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyz');
                var sql = "INSERT INTO `users` (`first_name`, `last_name`, `email`, `password`, `salt`) VALUES ";
                var str4 = sql + "(" + "\'" + req.session.firstName + "\', " + "\'" + req.session.lastName + "\', " + "\'" +
                  req.session.email + "\', PASSWORD(\'" + salt + req.body.newPassword + "\'), " + "\'" + salt + "\');";
                con.query(str4, function (err, result) {
                  if (err) {
                    console.log("error number ten");
                    console.log(err);
                    addToFile(err, req.body, req.files, 10);
                    res.json({ "message": "error code #10, if this error persists please report it to a member of our team!" });
                    con.end();
                    return res.end();
                  }
                  res.json({ "message": "Password change sucessful" });
                  console.log("Password change successful");
                  con.end();
                  return res.end();
                });
              });
            } else if (!(result.length > 0)) {
              res.json({ "message": "Please make sure you entered your old password correctly" });
              con.end();
              return res.end();
            }
          });
        });
      });
    } catch (err) {
      console.log("error number fifty eight");
      console.log(err);
      addToFile(err, req.body, req.files, 58);
      res.json({ "error": "true", "message": "error code #58, if this error persists please report it to a member of our team!" });

      return res.end();
    }

  }
  else {
    console.log("email != user email || not logged in? ")
  }
});


/**
 * 
 */
router.post('/forgotPassword', function (req, res) {

  console.log("reached forgot password post request");

  var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieBookExchange",
    port: 3306
  });

  try {
    con.connect(function (err) {
      if (err) {
        console.log("error number eleven");
        console.log(err);
        addToFile(err, req.body, req.files, 11);
        res.json({ "message": "error code #11, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      var str = "SELECT * FROM users WHERE email=\'" + req.body.email + "\';";
      con.query(str, function (err, result) {
        if (err) { con.end(); res.end(); }
        if (result.length > 0) {
          console.log("Email exists in database for change password");
          verificationNumber = randomString(40, '0123456789abcdefghijklmnopqrstuvwxyz');
          var str2 = "INSERT INTO `passwordReset` (`email`,`verificationNumber`) VALUES (\'" + req.body.email + "\',\'" + verificationNumber + "\');";

          con.query(str2, function (err, result2) {
            if (err) { con.end(); res.end(); }
            res.json({ "error": false, "message": "Please wait for an email with a link to reset password" });
            res.end();
            con.end();

            const output = `
              <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
              <h3>Reset password request</h3>
              <p>Click <a href="https://exchange.peddie.org/changePassword.html?${verificationNumber}">here</a> to reset your password</p>
              `;

            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'compsciclub@peddie.org',
                pass: '@peddie0225'
              }
            });

            const mailOptions = {
              from: 'compsciclub@peddie.org',
              to: req.body.email,
              subject: 'Reset password request',
              html: output
            };

            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log("error number thirty three");
                console.log(err);
                addToFile(err, req.body, req.files, 33);
                res.json({ "error": "true", "message": "error code #33, unabale to send email, if this error persists please report it to a member of our team!" });
                con.end();
                return res.end();
              } else {
                console.log('Email Sent: ' + info.response);
              }
            });
          });

        } else {
          res.json({ "message": "Email does not exist" });
          console.log("email does not exist");
          res.end();
          return con.end();
        }
      });
    });

  } catch (err) {
    console.log("error number fifty nine");
    console.log(err);
    addToFile(err, req.body, req.files, 59);
    res.json({ "error": "true", "message": "error code #59, if this error persists please report it to a member of our team!" });

    return res.end();
  }
});


/**
 * This logs the user in instead of checking if they are logged in
 * Creates a connection to database, then we need to querry the databse to get our salt(remember we store passwords with a salt and then hash
 * the password with that salt so we need the salt to create our password that is stored in the databse). After this we run a querry to the
 * database with their username + password returns a result with a length greater than zero(basically if their username + password are in the 
 * database then they can login). We use the length of the result because we found that this was the easiest and cleanest way to determine whether
 * or not something is or isnt in the database. If they are in the database we also set up several session variables so that we can remember that 
 * a client is logged in/who they are so when they make other requests we confirm that they are logged in + the account belongs to them. We also 
 * use the session variables for various other functions as it lowers the amount of querries we have to make. 
 */
router.post('/login', function (req, res) {

  console.log("reached login post request");

  var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieBookExchange",
    port: 3306
  });
  // alert("function is being called from test.js");
  try {
    con.connect(function (err) {
      if (err) {
        console.log("error number thirty four");
        console.log(err);
        addToFile(err, req.body, req.files, 34);
        res.json({ "error": "true", "message": "error code #34, unable to connect, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      console.log("opened connection in login");
      var str = "SELECT * FROM users WHERE email=\'" + req.body.email + "\';";
      //var SellerQuery = "SELECT * FROM Book_List ORDER BY column1 ASC;" TO-DO add user column
      con.query(str, function (err, result) {
        if (err) {
          console.log("error number thirty five");
          console.log(err);
          addToFile(err, req.body, req.files, 35);
          res.json({ "error": "true", "message": "error code #35, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }

        if (result.length > 0) {
          console.log('reached statement 1');
          str2 = "SELECT * FROM users WHERE email=\'" + req.body.email + "\' AND password=PASSWORD(\'" + result[0].salt + req.body.password + "\');";
          con.query(str2, function (err, result2) {
            if (err) {
              console.log("error number thirty six");
              res.json({ "error": "true", "message": "error code #36, you are not logged in, if this error persists please report it to a member of our team!" });
              addToFile(err, req.body, req.files, 36);
              con.end();
              return res.end();
            }
            if (result2.length > 0) {
              console.log('reached statement 2');
              req.session.loggedIn = true;
              req.session.email = req.body.email;
              req.session.password = req.body.password;
              req.session.firstName = result2[0].first_name;
              req.session.lastName = result2[0].last_name;
              console.log("logged in succesfully?");
              res.json({ "message": "success" });
              res.end();
              return con.end();
            } else {
              res.json({ "message": "please make sure your password has been entered correctly!" });
              console.log("login unsucessful");
              res.end();
              return con.end();

            }
          });

        } else {
          res.json({ "message": "please register for an account!" });
          console.log("login unsucessful");
          res.end();
          return con.end();
        }

      });
    });

  } catch (err) {
    console.log("error number sixty");
    console.log(err);
    addToFile(err, req.body, req.files, 60);
    res.json({ "error": "true", "message": "error code #60, if this error persists please report it to a member of our team!" });

    return res.end();
  }

});

/**
 * This is the setup method for more info, we store all the info about the book the user clicked on in a sesion variable
 */
router.post('/moreInfo', function (req, res) {
  console.log("more info post request reached");
  req.session.title = req.body.title;
  req.session.price = req.body.price;
  req.session.condition = req.body.condition;
  req.session.class = req.body.class;
  req.session.ISBN = req.body.ISBN;
  req.session.pageEmail = req.body.email;
  req.session.image = req.body.image;
  req.session.subject = req.body.subject;
  req.session.state = req.body.state;

  return res.end();
});

router.post('/moveBookState', function (req, res) {
  console.log("reached move book state");
  var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieBookExchange",
    port: 3306
  });

  try {
    con.connect(function (err) {
      if (err) {
        console.log("error number twelve");
        console.log(err);
        addToFile(err, req.body, req.files, 12);
        res.json({ "message": "error code #12, failed to connect, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      var query;
      var query2;
      switch (req.body.state) {
        case "movePendingToSold":
          query = "INSERT INTO Book_List_Sold SELECT * FROM Book_List_Pending WHERE Image = \'" + req.body.imageId + "\';";
          query2 = "DELETE FROM Book_List_Pending WHERE Image=\"" + req.body.imageId + "\";";
          break;
        case "movePendingToAvailable":
          query = "INSERT INTO Book_List SELECT * FROM Book_List_Pending WHERE Image = \'" + req.body.imageId + "\';";
          query2 = "DELETE FROM Book_List_Pending WHERE Image=\"" + req.body.imageId + "\";";
          break;
        case "moveSoldToPending":
          query = "INSERT INTO Book_List_Pending SELECT * FROM Book_List_Sold WHERE Image = \'" + req.body.imageId + "\';";
          query2 = "DELETE FROM Book_List_Sold WHERE Image=\"" + req.body.imageId + "\";";
          break;
        case "moveSoldToAvailable":
          query = "INSERT INTO Book_List SELECT * FROM Book_List_Sold WHERE Image = \'" + req.body.imageId + "\';";
          query2 = "DELETE FROM Book_List_Sold WHERE Image=\"" + req.body.imageId + "\";";
          break;
        default:
          return 0;
      }

      con.query(query, function (err, result) {
        if (err) {
          console.log("error number thirteen");
          console.log(err);
          addToFile(err, req.body, req.files, 13);
          res.json({ "message": "error code #13, query failed, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        con.query(query2, function (err, result2) {
          if (err) {
            console.log("error number thirty seven");
            console.log(err);
            addToFile(err, req.body, req.files, 37);
            res.json({ "error": "true", "message": "error code #37, query failed,if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          con.end();
          return res.end();
        });
      });
    });
  }
  catch (err) {
    console.log("error number sixty one");
    console.log(err);
    addToFile(err, req.body, req.files, 61);
    res.json({ "error": "true", "message": "error code #61, if this error persists please report it to a member of our team!" });

    return res.end();
  }
});
/**
 * Nodemailer for sending email after buyer clicks buy on a book
 */

router.post('/emailSeller', function (req, res) {
  console.log("reached email seller post request");

  var con = mysql.createConnection({
    host: "localhost",
    user: "admincs",
    password: "BeatBlair1864",
    database: "peddieBookExchange",
    port: 3306
  });

  try {
    con.connect(function (err) {
      if (err) {
        console.log("error number thirty eight");
        console.log(err);
        addToFile(err, req.body, req.files, 38);
        res.json({ "error": "true", "message": "error code #38, connection to DB failed, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      if (!inQue(req.body.imageID)) {

        que.push(req.body.imageID);
        var query1 = "INSERT INTO Book_List_Pending SELECT * FROM Book_List WHERE ISBN = \'" + req.body.bookISBN + "\' AND Email = \'" + req.body.email + "\' AND Image = \'" + req.body.imageID + "\';";
        con.query(query1, function (err, result) {
          if (err) {
            console.log("error number thirty nine");
            console.log(err);
            removeFromQue(req.body.imageID);
            addToFile(err, req.body, req.files, 39);
            res.json({ "error": "true", "message": "error code #39, query failed, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          var query2 = "DELETE FROM Book_List WHERE ISBN = \'" + req.body.bookISBN + "\' AND Email = \'" + req.body.email + "\' AND Image = \'" + req.body.imageID + "\';";
          con.query(query2, function (err, result) {
            if (err) {
              console.log("error number forty");
              console.log(err);
              removeFromQue(req.body.imageID);
              addToFile(err, req.body, req.files, 40);
              res.json({ "error": "true", "message": "error code #40, query failed if this error persists please report it to a member of our team!" });
              con.end();
              return res.end();
            }
            //below is the nodemailer to the seller
            const output = `
            <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
            <h4>${req.session.firstName} ${req.session.lastName} is looking to buy your book: ${req.body.bookName.replace(/_/g, " ")}</h4>
            <h4>The price you listed was: $${req.body.bookPrice}</h4>
            <h4>The buyer's email is: ${req.session.email}</h4>
            <h4>Please get into contact with the buyer to handle money and book transaction.</h4>
            <h4>Notes from the buyer:</h4>
            <p>${req.body.buyerMessage}</p>
            `;

            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'compsciclub@peddie.org',
                pass: '@peddie0225'
              }
            });

            const mailOptions = {
              from: 'compsciclub@peddie.org',
              to: req.body.email,
              subject: 'Book order notification: ' + req.body.bookName.replace(/_/g, " "),
              html: output
            };

            transporter.sendMail(mailOptions, function (err, info) {
              if (err) {
                console.log(err);
                console.log("error code 41");
                addToFile(err, req.body, req.files, 41);
                res.json({ "error": "true", "message": "book purchase failed(code #41)! Please try again or email a member of our team if the error persists" });
                return res.end();
              } else {
                console.log('Email Sent: ' + info.response);
                res.send({ "message": "Your purchase was sucessful! Please get into contact with the seller to handle money and book transaction." });
                res.end();

              }
            });

            //Below is the nodemailer to the buyer

            const output2 = `
            <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
            <h4>You sent a book order to buy the book: ${req.body.bookName.replace(/_/g, " ")}</h4>
            <h4>The price listed was: $${req.body.bookPrice}</h4>
            <h4>The seller's email is: ${req.body.email}</h4>
            <h4>Here are the notes you entered:</h4>
            <p>${req.body.buyerMessage}</p>
            `;

            const transporter2 = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'compsciclub@peddie.org',
                pass: '@peddie0225'
              }
            });

            const mailOptions2 = {
              from: 'compsciclub@peddie.org',
              to: req.session.email,
              subject: 'Book order receipt for : ' + req.body.bookName.replace(/_/g, " "),
              html: output2
            };

            transporter2.sendMail(mailOptions2, function (err, info) {
              if (err) {
                console.log(err);
                console.log("error code sixty five");
                res.json({ "error": true, "message": "book purchase failed(code 65)! Please try again or email a member of our team if the error persists" });
                res.end();
              } else {
                console.log('Email Sent: ' + info.response);
                res.send({ "message": "Your purchase was sucessful! The seller should get in contact with you shortly!" });
                res.end();

              }
            });
            removeFromQue(req.body.imageId);

            return con.end();
          });
        });
      } else {
        con.end();
        res.json({ "message": "We are sorry, someone else has just purchased that book, please pick a different one!" });
        res.end();
      }
    });
  } catch (err) {
    console.log("error number sxity two");
    console.log(err);
    addToFile(err, req.body, req.files, 62);
    res.json({ "error": "true", "message": "error code #62, if this error persists please report it to a member of our team!" });

    return res.end();
  }




});

router.post('/reportFrontEndError', function (req, res) {
  if (req.session.email && req.session.loggedIn == true) {
    addToFile(req.body.error, req.body.variables, req.body.files, 66);
    res.end();
  }


});

/**
 * Used for registering a user, checks the fields the user sent to see if they meet the requirements for an email + password and if they do 
 * then they are added to the database, there are no duplicates allowed. Basically we run a check to make sure all our conditoins are met(
 * although we have the bootstrap alerts they don't prevent the request from being sent to the backend so we must do that ourselves). If conditions
 * for creating an account are met, we setup a querry and insert their info into the temporary database(we even store this salted and hashed). 
 * We also generate a random alpahnumeric string as their unique key/verifacitonNumber. We then use nodemailer to setup an email with this key
 * attached to the end of the link. Once we send this link to the client they will be able to clikc the link with their unique key at the end to 
 * verify the account. 
 */
router.post('/register', function (req, res) {
  console.log("reached register post request");
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  // this checks that all conditions have been met + if so puts the info into the users database (front end checks to but incase someone inspects
  //we have a backup on here )
  if (password == passwordConfirm &&
    checkPassword(password) &&
    email.endsWith("@peddie.org") &&
    validator.validate(email)) {
    console.log("valid password and stuff");
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });

    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number code 42");
          console.log(err);
          addToFile(err, req.body, req.files, 42);
          res.json({ "error": "true", "message": "error code #42, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        con.query('SELECT * FROM verification WHERE email = ?', [req.body.email]
          , function (err, rows) {
            if (err) {
              console.log("error number forty three");
              console.log(err);
              addToFile(err, req.body, req.files, 43);
              res.json({ "error": "true", "message": "error code #43, if this error persists please report it to a member of our team!" });
              con.end();
              return res.end();
            }
            if (!rows.length) {
              console.log("not in verifiation");
              con.query('SELECT * FROM users WHERE email = ?', [req.body.email]
                , function (err, rows) {
                  if (err) {
                    console.log("error number forty four");
                    console.log(err);
                    addToFile(err, req.body, req.files, 44);
                    res.json({ "error": "true", "message": "error code #44, if this error persists please report it to a member of our team!" });
                    con.end();
                    return res.end();
                  }
                  if (!rows.length) {
                    console.log("not in users");
                    var random = randomString(40, '0123456789abcdefghijklmnopqrstuvwxyz');
                    var salt = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyz');

                    var sql = "INSERT INTO `verification` (`first_name`, `last_name`, `email`, `password`,`verification_number`,`salt`) VALUES ";
                    var str = sql + "(" + "\'" + firstName + "\', " + "\'" + lastName + "\', " + "\'" + email + "\',PASSWORD(\'" + salt + password + "\')," + "\'" + random + "\'," + "\'" + salt + "\'" + ");";
                    con.query(str, function (err, result) {
                      if (err) {
                        console.log("error number forty five");
                        console.log(err);
                        addToFile(err, req.body, req.files, 45);
                        res.json({ "error": "true", "message": "error code #45, if this error persists please report it to a member of our team!" });
                        con.end();
                        return res.end();
                      }
                      console.log("all fields go!");
                      res.json({ "error": false, "message": "Your Submission Was Successful, please wait for a link to verify your email." });
                      res.end();
                      con.end();

                      const output = `
                        <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
                        <h3>Congratulations! You have successfully registered for Peddie Book Exchange!</h3>
                        <p>Click <a href="https://exchange.peddie.org/nodejs/verificationSite/:${random}">here</a> to verify your email</p>
                        `;

                      const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: 'compsciclub@peddie.org',
                          pass: '@peddie0225'
                        }
                      });

                      const mailOptions = {
                        from: 'compsciclub@peddie.org',
                        to: req.body.email,
                        subject: 'Peddie Book Exchange Confirmation Email',
                        html: output
                      };

                      transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                          console.log("error number forty six");
                          console.log(err);
                          addToFile(err, req.body, req.files, 46);
                          res.json({ "error": "true", "message": "error code #46, email failed to send, if this error persists please report it to a member of our team!" });
                          con.end();
                          return res.end();
                        } else {
                          console.log('Email Sent: ' + info.response);
                        }
                      });

                    });
                  }
                  else {
                    console.log("Email exists alrdy");
                    res.send({ "error": true, "message": "Your Email Already Exists, please login!" });
                    con.end();
                    return res.end();
                  }
                });

            } else {
              console.log("You have already registered!");
              res.send({ "error": true, "message": "You have already registered!" });
              con.end();
              return res.end();
            }

          });
      });
    } catch (err) {
      console.log("error number sixty three");
      console.log(err);
      addToFile(err, req.body, req.files, 63);
      res.json({ "error": "true", "message": "error code #63, if this error persists please report it to a member of our team!" });

      return res.end();
    }


  } else {
    res.end();

  }

});

/**
 * Sorry this is long :) , I tried to condense it but hard to explain all the variables 
 * This is used for the homepage and allows the user to sort books in several ways(oldest first, condition, price). This funcitno returns nine
 * books at a time to ensure a quick response because if there are thousands of books in the database sending that large of a json file and 
 * loading that many images would take a very long time thus we use multiple pages on our home page to counteract this. First we edit our spot 
 * variable(this variable is basically a sesion variable that stores our place in the list,(e.g. we divide the book list(not actually divide with
 *  code just in theory) into groups of 9, and use this variable to store which group we are in) we then update the spot by adding the body 
 * addval(this is for next and last variables, next moves us up a group so addVal is 1 and last moves us back so addVal is -1, we use parseInt 
 * because (all sesion vars are strings so we must convert it to an int via parse int). Then If the spot is less than 0 we set it to 0. Also 
 * if the old sort type( we store the last sort method(eg price, condition, regular ) as sesion var) isn't equal to the new sort type(a body var)
 * then we want to go back to the beginning as well. The previous statement is dependent on the useLast variable however, which is a variable 
 * set by next and last buttons, as if the request is coming from those buttons then we dont want to reset our spot to zero, we want to keep it 
 * at its normal spot. After this we search the book list based on the sort type (if the useLast variable is true then we use the last sort
 * method and we make sure to save our last sort method to the lastBookType sesion var). After we querry the database, we create a json object that
 * we are going to send back to the client and use the spot variable to append the proper books to that variable (we call it resJson). we then send 
 * that variable back to the client and the books in that vairalbe are displayed. 
 */
router.post('/sortBook', function (req, res) {
  console.log("redirected to sort book post request, type ='s " + ((req.body.sortBy) ? req.body.sortBy : "default"));
  console.log(req.body);
  req.session.bookListSpot = parseInt(req.body.addVal) + parseInt(req.session.bookListSpot);
  console.log(req.session.bookListSpot);

  console.log(req.body.useLast);
  if (parseInt(req.session.bookListSpot) < 0 || (req.session.lastBookType != req.body.sortBy && !req.body.useLast)) {
    req.session.bookListSpot = 0;
    console.log("reset bookList spot to 0");
  }

  if (req.session.email && req.session.loggedIn == true) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "admincs",
      password: "BeatBlair1864",
      database: "peddieBookExchange",
      port: 3306
    });
    // alert("function is being called from test.js");
    try {
      con.connect(function (err) {
        if (err) {
          console.log("error number forty seven");
          console.log(err);
          addToFile(err, req.body, req.files, 47);
          res.json({ "error": "true", "message": "error code #47, if this error persists please report it to a member of our team!" });
          con.end();
          return res.end();
        }
        console.log("opened connection in book price load");

        var BookConditionQuery = " order by case when BookCondition=\"As_New\" then 1 when BookCondition=\"Very_Good\" then 2  when BookCondition=\"Fair\" then 4  when BookCondition=\"Poor\" then 5 when BookCondition=\"Good\" then 3  end;";
        var BasicQuery = " ORDER BY id DESC;";
        var PriceQuery = " ORDER BY price ASC;";
        var userQuery = "SELECT * FROM Book_List WHERE email=\"" + req.session.email + "\" ORDER BY id DESC;";

        //var SellerQuery = "SELECT * FROM Book_List ORDER BY column1 ASC;" TO-DO add user column
        var pendingQuerry = "SELECT * FROM Book_List_Pending WHERE email=\"" + req.session.email + "\" ORDER BY id DESC;";
        var soldQuerry = "SELECT * FROM Book_List_Sold WHERE email=\"" + req.session.email + "\" ORDER BY id DESC;";
        var removeQuerry = "SELECT * FROM Book_List WHERE email=\"" + req.session.email + "\" UNION " + "SELECT * FROM Book_List_Sold WHERE email=\"" +
          req.session.email + "\" UNION " + "SELECT * FROM Book_List_Pending WHERE email=\"" + req.session.email + "\" ORDER BY id DESC;";

        var str;
        var sortBy = req.session.lastBookType;
        if (!req.body.useLast) {
          sortBy = req.body.sortBy;
        }
        if (req.body.subjValue) {
          req.session.subjValue = req.body.subjValue;
        }
        req.session.lastBookType = sortBy;
        console.log(sortBy);
        switch (sortBy) {
          case "price":
            console.log("price selected");
            req.session.orderMethod = PriceQuery;
            str = checkSubj(req, PriceQuery);
            break;
          case "BookCondition":
            console.log("book condition selected");
            req.session.orderMethod = "price";
            str = checkSubj(req, BookConditionQuery);
            req.session.orderMethod = BookConditionQuery;
            break;
          case "user":
            clearSubjAndOrderMethod(req);
            str = userQuery;

            break;
          case "remove":
            clearSubjAndOrderMethod(req);
            str = removeQuerry;
            break;
          case "subject":
            str = "SELECT * FROM Book_List WHERE Subject=\"" + req.session.subjValue + "\"";
            if (req.session.orderMethod && req.session.orderMethod != "") {
              str += req.session.orderMethod;
            } else {
              str += ";";
            }
            break;
          case "search":
            if (req.body.searchQuerry) {
              req.session.searchQuerry = req.body.searchQuerry;
            }
            var checkSubject = "";
            if (req.session.subjValue && req.session.subjValue != "") {
              checkSubject = " AND Subject=\"" + req.session.subjValue + "\" ";
            }
            //if querry len> 2 then search for the substring in the whole entry, else just search for strings that start with querry
            if (req.session.searchQuerry.length > 3) {
              str = "SELECT * FROM Book_List WHERE Subject LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE ISBN LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Title LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Class LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Email LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject;
              console.log("usring search for sortby");
            } else {
              str = "SELECT * FROM Book_List WHERE Subject LIKE \"" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE ISBN LIKE \"" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Title LIKE \"" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Class LIKE \"" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Email LIKE \"" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Subject LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE ISBN LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Title LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Class LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject + " UNION " +
                "SELECT * FROM Book_List WHERE Email LIKE \"%" + req.session.searchQuerry.replace(/ /g, "_") + "%\"" + checkSubject;
              if (req.session.orderMethod && req.session.orderMethod != "") {
                str += req.session.orderMethod;
              } else {
                str += ";";
              }
            }
            break;
          case "pending":
            clearSubjAndOrderMethod(req);
            str = pendingQuerry;
            break;
          case "sold":
            clearSubjAndOrderMethod(req);
            str = soldQuerry;
            break;
          case "clear":
            clearSubjAndOrderMethod(req);
          default:
            console.log("default");
            str = checkSubj(req, BasicQuery);
            req.session.orderMethod = BasicQuery;
        }
        con.query(str, function (err, result) {
          if (err) {
            console.log("error number forty eight");
            console.log(err);
            addToFile(err, req.body, req.files, 48);
            res.json({ "error": "true", "message": "error code #48, if this error persists please report it to a member of our team!" });
            con.end();
            return res.end();
          }
          if (!req.session.bookListSpot) {
            req.session.bookListSpot = 0;
          }
          var resJson = [];
          var end = ((req.session.bookListSpot * 9 + 9) > result.length) ? result.length : req.session.bookListSpot * 9 + 9;
          if (req.session.bookListSpot * 9 > result.length) {
            req.session.bookListSpot = parseInt(req.session.bookListSpot) - 1;
          }
          for (var i = req.session.bookListSpot * 9; i < end; i++) {
            resJson.push(result[i]);
          }
          res.json(resJson);
          res.end();
          con.end();
        });
      });

    } catch (err) {
      console.log("error number fifty one");
      console.log(err);
      addToFile(err, req.body, req.files, 51);
      res.json({ "error": "true", "message": "error code #51, if this error persists please report it to a member of our team!" });

      return res.end();
    }
  }
  else {

  }

});
/**
 *This is long too, sorry lol 
 *  first step here is useMulter.any(), this parses the multipart form(read docs for this). We then setup our path var, which is where we will store 
 * our images, we want them to be in the same directory as our html code so we can access it locally. the .replace is used to get rid of spaces
 * in the filename, we dont want spaces because when these values are passed back to the front end as variables there can be no spaces. we then 
 * check if the bytesOfCropArea(how many bytes the cropped image takes up) is bigger than the max size we allow, and if it is we calculate the 
 * width that the image would need to be resized to make it 300kb(or whatever the max is), also this is solving this equation
 * (resizeWidth*resizeHeight*bytesPerPixel=MaxByteSize <= we use bpx*resizeW*resizeH bc that is equal to bytesOfCropArea
 * or how much space the image takes up, if you think about it width*height*bytes per pixel(eg how many bytes each pixel takes up
 * will give you the size), we can then subsite with resizeWidth=(22/28)resizeHeight(bc the aspect ratio), and solve for the width). With this we
 * then write the image to a file, and try to autorotate it(see doc for why we do this), if the image doesn't have exif data or can't be rotated
 * then it will throw an error and we know that we don't need to rotate and we just have to crop it. Otherwise we use the buffer output(a buffer
 * if you remember is just data stored in RAM) and write it to a file(our cropper only accepts files not buffers for some reason) and then from
 * there we crop it. When cropping we make sure to multiply all crop points by the crop ratio, we must do this because the modal resizes the image
 * so the crop points(basically the verticies of the rectangle the user crops the image in) are scalled for that image, but the image the client 
 * sends over to us is not resized, so we must take a note of that ratio and then scale our crop points accordingly. We also leave the quality at 
 * 100%( we already have a cap on size so no need to decrease quality), and then we use the resize width that we generated from before.  
 */
router.post('/uploadUserBookImage', useMulter.any(), function (req, res) {
  console.log("reached uploadUserBooKImage post request");

  let path = '/var/www/PeddieBookExchange/userBookImages/' + req.body.fileName.replace(/ /g, "_");
  console.log(path);
  if (req.files.length > 0) {

    console.log("request boyd");
    console.log(req.body);
    console.log(req.files[0].buffer.length);
    console.log(req.files[0]);
    var bytesOfCropArea = req.files[0].size * (((req.body.ratio * req.body.cropWidth) / req.body.originalWidth) * ((req.body.ratio * req.body.cropHeight) / req.body.originalHeight));
    var bytesPerPx = req.files[0].size / (req.body.originalHeight * req.body.originalWidth);
    var resizeWidth = req.body.ratio * req.body.cropWidth;
    var maxByteSize = 300000;
    var qualitySubtractor = 0;

    if (bytesOfCropArea > maxByteSize) {

      resizeWidth = Math.sqrt(maxByteSize / (bytesPerPx * (22 / 28)));

      console.log("resize witdh edited " + resizeWidth);
    }


    console.log("bytes of crop area below");
    console.log(bytesOfCropArea);
    console.log("bytes per px below");
    console.log(bytesPerPx);

    try {

      console.log(req.files[0].size);

    } catch (e) {
      console.log("error");
      if (err) {
        console.log("error number forty nine");
        console.log(err);
        addToFile(err, req.body, req.files, 49);
        res.json({ "error": "true", "message": "error code #49, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
    }
  }
  if (req.files[0] && !(req.files[0] == undefined)) {
    fs.writeFile(path, req.files[0].buffer, function (err) {
      if (err) {
        console.log("error number fourteen");
        console.log(err);
        addToFile(err, req.body, req.files, 14);
        res.json({ "error": "true", "message": "error code #14, if this error persists please report it to a member of our team!" });
        con.end();
        return res.end();
      }
      console.log("sucessful first write");
      //if we don't have a check and a field is empty then the canvas will throw an error that we can't catch for some reason 
      if (!(req.body.cropX == undefined) && !(req.body.cropX == undefined) && !(req.body.cropY == undefined) && !(req.body.cropWidth == undefined) && !(req.body.cropHeight == undefined) && !(req.body.ratio == undefined) && !(req.body.originalWidth == undefined) && !(req.body.originalHeight == undefined) &&
        !(req.body.cropX == 'undefined') && !(req.body.cropX == 'undefined') && !(req.body.cropY == 'undefined') && !(req.body.cropWidth == 'undefined') && !(req.body.cropHeight == 'undefined') && !(req.body.ratio == 'undefined') && !(req.body.originalWidth == 'undefined') && !(req.body.originalHeight == 'undefined')) {
        console.log("in the supposed stopper if statement");

        try {
          jo.rotate(path, options, (error, buffer, orientation, dimensions, quality) => {
            console.log("using auto rotate");
            if (error) {
              console.log(error);
              console.log(error.message);
              if (!(orientation == undefined)) {
                console.log(orientation);
              }
              console.log("error was thrown from auto rotate, so now we are in here");
              Clipper(path, function () {
                this.crop(req.body.cropX * req.body.ratio, req.body.ratio * req.body.cropY,
                  req.body.ratio * req.body.cropWidth, req.body.ratio * req.body.cropHeight)
                  .resize(resizeWidth)
                  .quality(100)
                  .toFile(path, function () {
                    console.log('saved!');
                    res.json({ "message": "sucessfully added image" });
                    return res.end();
                  });

              });
            }
            else if (!(orientation == undefined) && !(dimensions == undefined) && !(quality == undefined)) {
              console.log(`Orientation was ${orientation}`);
              console.log(`Dimensions after rotation: ${dimensions.width}x${dimensions.height}`);
              console.log(`Quality: ${quality}`);

              if (orientation > 4) {
                console.log("changing resize width");

              }
              // ...Do whatever you need with the resulting buffer...
              fs.writeFile(path, buffer, function (err) {
                if (err) {
                  console.log("error number fifteen");
                  console.log(err);
                  addToFile(err, req.body, req.files, 15);
                  res.json({ "message": "error code #15, write failed, if this error persists please report it to a member of our team!" });

                  return res.end();
                } else {
                  console.log("success");
                  console.log(path);
                  console.log(req.body.ratio);
                  console.log(req.body.cropWidth);
                  console.log(resizeWidth);
                  Clipper(path, function () {
                    this.crop(req.body.cropX * req.body.ratio, req.body.ratio * req.body.cropY,
                      req.body.ratio * req.body.cropWidth, req.body.ratio * req.body.cropHeight)
                      .resize(resizeWidth)
                      .quality(100)
                      .toFile(path, function () {
                        console.log('saved!');
                        res.json({ "message": "sucessfully uploaded image!" });
                        return res.end();
                      });
                  });
                }
              });
            }
          });
        } catch (e) {
          console.log("inside the promise rejection catch but seems like might not be catching rejection");

        }
      }

    });
  } else if (req.body.reCropOriginal) {

    console.log(req.body);
    console.log("hit the statement where we are re cropping the original");
    Clipper(path, function () {
      this.crop(req.body.cropX * req.body.ratio, req.body.ratio * req.body.cropY,
        req.body.ratio * req.body.cropWidth, req.body.ratio * req.body.cropHeight)
        .resize(req.body.cropWidth * req.body.ratio)
        .quality(100)
        .toFile(path + "1", function () {
          res.json({ "message": "sucessfully edited, please clear cache to see updated image" });
          console.log('re-cropped original!');
          fs.unlink(path, function (error) {
            if (error) {
              addToFile(err, req.body, req.files, 71);
              res.json({ "message": "error code #71, write failed, if this error persists please report it to a member of our team!" });
              return res.end();
            }

            return res.end();

          });
        });
    });
  } else {
    res.json({ "message": "failed to upload image" });
    return res.end();
  }


});

//end of post.html(here we simply tell express to use the router(not completely sure what this does but from the very short research I did
// it appears that if you want to do more complex redirects so I used it incase any future students need it))

app.use('/', router);
const port = 5620;

/**
 * This is the last request so we assume that the user went to a page the doesn't exist hence it is the 404 request
 */
app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.redirect('https://exchange.peddie.org/404.html')
    return res.end();
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return res.end();
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
  return res.end();
});

/**
 * The most important part of the code :), this tells express to listen on port 5620 of the local host(our proxy will route the requests to us,
 *  if you need a refresher on that just look through the docs)
 * (if you reaad this far we really do appreciate you taking the time to look through all of this and 
 * try to learn, personally i suck at making stuff readable and explaining stuff but hopefully you got the gist of what we were trying to do)
 */
app.listen(port, () => {
  console.log(`Server running on port${port}`);
});