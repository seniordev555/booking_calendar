'use strict'

var mongoose = require('mongoose');
var async = require('async');
if (mongoose.modelNames().indexOf('Booking') == -1) {
    require('../models/booking');
}

var config = require('config');
mongoose.connect(config.get('db'));

exports.id = '1507048662357_add_created_at_to_bookings';

exports.up = function(next) {
    var Booking = require('mongoose').model('Booking');
    Booking.find({
        updated_at: null
    }, function (err, bookings) {
        async.mapSeries(bookings, function (booking, nextBooking) {
            var datetime = new Date(booking._id.getTimestamp());
            booking.set({
               created_at: datetime,
               updated_at: datetime
            });

            booking.save(nextBooking);
        }, function () {
            next();
        });
    });
};

exports.down = function(next) {
  next();
};
