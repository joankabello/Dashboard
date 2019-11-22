const express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
const path = require('path');
var app = express();
var server = require('http').Server(app);
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan = require('morgan');
var session = require('express-session');

var port = 8080;
var configDB = require('./config/database.js');

mongoose.connect(configDB.url);

require('dotenv').config();
require('./config/passport')(passport);

app.use(cookieParser());
app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.use("/api", express.static('./api/'));
app.use("/youtube", express.static('./youtube/'));
app.use("/interact", express.static('./interact/'));
app.use("/fancybox", express.static('./fancybox/'));
app.use("/public", express.static('./public/'));

app.use(session({ secret: 'ilovescotchscotchyscotchscotch' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Origin", "Origin, X-Requestet-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "PUT, GET, POST, DELETE, OPTIONS");
    next();
})

require('./api/routes.js')(app, passport);

server.listen(port, function() {
    var port = server.address().port;
    console.log("App running on port " + port);
})
