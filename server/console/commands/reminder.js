/**
 * Provide command send an email notification to 
 * booking owner, shared_used to remind before booking started.
 * 
 * Usage
 * NODE_ENV=<enviroment> node bin/cli.js reminder
 * 
 * Log files has been storaged on <app>/logs 
 * 
 */
'use strict';

var async = require('async');
var config = require('config');
var moment = require('moment');
var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');

winston.add(DailyRotateFile, {
    name: "reminder-info",
    level: "info",
    filename: "reminder-info",
    json: false,
    dirname: "logs",
    datePattern: ".yyyy-MM-dd.log"
});

winston.add(DailyRotateFile, {
    name: "reminder-error",
    level: "error",
    filename: "reminder-error",
    json: false,
    dirname: "logs",
    datePattern: ".yyyy-MM-dd.log"
});


var Booking = require('mongoose').model('Booking');
var bookingReminder = require(__dirname + '/../../helpers/booking-mailer').sendEmailReminder;

var commander = require('commander');
commander
.command('reminder')
.description('Send mail remind booking notification')
.action(function(env, options) {
    
    var rConfig = config.get('reminder.remindTime');
    
    var sConfig = config.get('reminder.scheduleTime');
    
    var now = moment();
    var remindTime = now.add(rConfig.duration, rConfig.unit);
    var deltaTime = remindTime.clone().add(sConfig.duration, sConfig.unit);
    
    // Define query
    var bookingQuery = {
        "time_in": {
            "$gte": remindTime.toDate(),
            "$lte": deltaTime.toDate(),
        }
    }
    
    winston.info("Starting booking remind");
    winston.profile('reminder');

    Booking.find(bookingQuery, function (err, bookings) {
        async.mapSeries(
            bookings,
            function (booking, nextBooking) {
                bookingReminder(booking, function (err,sent, bNotification) {
                    if (err) {
                        winston.error(err);
                    }
                    
                    if (sent) {
                        winston.info("Mail remind was send for booking", {
                            "booking_id": booking.id,
                            "booking_production": booking.production
                        });
                    } else {
                        winston.info("Email remind already send", {
                            "booking_id": booking.id,
                            "booking_production": booking.production
                        });
                    }
                    
                    nextBooking();
                });
            },
            function () {
                winston.profile('reminder', "All booking was processed", function () {
                   process.exit(); 
                });
            }
        );
    });
});