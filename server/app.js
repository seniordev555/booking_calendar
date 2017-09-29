// Sometime nodejs search module & config on current working directory.
// So we should change to this directory to ensure processor always
// find modules & configs on app directory (not on working dir.

process.chdir(__dirname);

var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('winston');
var loggerHelper = require('./helpers/winston');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('config');

// require models
require("./models/user");
require("./models/booking");
require("./models/booking-email-notification");
require("./models/user-setting");

var routes = require('./routes/index');
var users = require('./routes/users');
var bookings = require('./routes/bookings');

var appAuth = require('./routes/auth');

mongoose.connect(config.get('db'));

var app = express();

// Init session
var minute = 60 * 1000;
var lifetime = config.get("session.lifetime");

app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: config.get("session.secret"),
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    cookie: { 
        maxAge: lifetime * minute
    }
}));

appAuth(app);
loggerHelper.init(logger);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(config.get('clientFolder')));

app.use('/', routes);
app.use('/users', users);
app.use('/api/bookings', bookings);

// Add headers


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render({
        message: err.message,
        error: {}
    });
});


module.exports = app;
