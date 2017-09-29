// Migrate new settings registered users.

'use strict'

var mongoose = require('mongoose');
var async = require('async');
if (mongoose.modelNames().indexOf('User') == -1) {
    require('../models/user');
}

var config = require('config');
mongoose.connect(config.get('db'));

exports.up = function(next) {
    var User = require('mongoose').model('User');
    User.find({
        "emailNotifications": null
    }, function (err, users) {
        async.mapSeries(users, function (user, nextUser) {
            user.set({
               "emailNotifications": {
                   "bookingUpdated": true,
                   "bookingCreated": true,
                   "bookingRemind": true,
                   "newSharedBooking": true
               } 
            });
            
            user.save(nextUser);
        }, function () {
            next();
        });
    });
};

exports.down = function(next) {
  next();
};
