// Helper send email notification to user when booking was updated.
// Generate sharing token & send email to shared emails & users.

'use strict';

var mailer = require('./mailer');
var BookingHasher = require('./booking-hasher');
var _ = require('lodash');
var moment = require('moment');
var async = require('async');
var path = require('path');
var BookingEmailNotification = require('mongoose').model('BookingEmailNotification');

function getSiteUrl(path)
{
    return require('config').get('siteUrl') +  (path || ""); 
}

function getBookingUrl(booking)
{
    return getSiteUrl('/#/booking/' + booking._id);
}

function getShareUrlForUser(booking, user)
{
    var token = BookingHasher.createTokenForUser(booking, user);
    return getSiteUrl("/#/sharing?invitation_token=" + token);
}

function sendEmailUpdateBooking(booking, callback) {
    var receivers = [];
    booking.populate('owner personnel.shared_users', function (err, booking) {
        receivers = [];
        receivers = receivers.concat(booking.personnel.shared_users); 
        if (booking.owner && booking.owner.email) {
            receivers.unshift(booking.owner);
        }
        
        async.mapSeries(receivers, function (receiver, nextReceiver) {
            if (!receiver.email || ! receiver.wantReceiveEmailBookingUpdated()) {
                return nextReceiver();
            }
            
            var template = path.join('views', 'emails', 'booking-updated');
            var data = { booking: booking.toJSON() };
            _.defaultsDeep(data, {
                "sender": booking.owner.fullname,
                "receiver": receiver.fullname,
                "booking_url": getBookingUrl(booking),
                "site_url": getSiteUrl()
            });
            
            
            data.booking.time_in = moment(booking.time_in).format("YYYY-MM-DD HH:mm");
            data.booking.time_out = moment(booking.time_out).format("YYYY-MM-DD HH:mm");
            
            mailer.send(receiver.email, template, data, function () {
                nextReceiver();
            });
        }, function () {
            callback();
        });
        
    });
}

function sendEmailConfirmationToOwner(booking, callback) {
    booking.populate('owner', function (err, booking) {
        var owner = booking.owner;
        if (! owner.email || ! owner.wantReceiveEmailBookingCreated()) {
            return callback();
        }
        
        var template = path.join('views', 'emails', 'booking-created');
        
        var data = {
            "booking": booking.toJSON()
        };
        _.defaultsDeep(data, {
            "receiver": booking.owner.fullname,
            "booking_url": getBookingUrl(booking),
            "site_url": getSiteUrl()
        });
        
        data.booking.time_in = moment(booking.time_in).format("YYYY-MM-DD HH:mm");
        data.booking.time_out = moment(booking.time_out).format("YYYY-MM-DD HH:mm");
        
        mailer.send(booking.owner.email, template, data, function () {
            callback();
        });
    });
};

function sendMailForSharedUsers(users, booking, callback)
{
    var template = path.join('views', 'emails', 'booking-shared');
    // Send mail to new shared users
    async.eachSeries(users, function (user, nextUserCb) {
        
        if ( ! user.email || !user.wantReceiveEmailSharedBooking() ) {
            return nextUserCb();
        }
        
        var data = {
            "booking": booking.toJSON(),
            "shared_user": user.toJSON()
        };
        
        var bookingUrl = getBookingUrl(booking);
        if (user.isEmpty) {
            bookingUrl = getShareUrlForUser(booking, user);
        }
        
        _.defaultsDeep(data, {
            sender: booking.owner.fullname || booking.email.substr(0, booking.email.indexOf("@")),
            receiver: user.fullname || "", 
            site_url: getSiteUrl(),
            booking_url: bookingUrl,
        });
        
        mailer.send(user.email, template, data, function (err, info) {
            nextUserCb();
        });
    }, function () {
        callback();
    });
}

/**
 * Send email to owner, shared users.
 */
function sendEmailReminder(booking, callback)
{
    var template = path.join('views', 'emails', 'booking-reminder');
    // var self = this;
    function sendEmailSingleUser(user, done)
    {
        if (!user.email || ! user.wantReceiveEmailBookingRemind()) {
            return done();
        }
        
        var data = {
            "booking": booking.toJSON(),
            "receiver": user.fullname || user.email.substr(0, user.email.indexOf("@")),
            "site_url": getSiteUrl(),
            "time_countdown": moment(booking.time_in).fromNow(),
            "booking_url": getBookingUrl(booking)
        };
        
        mailer.send(user.email, template, data, function () {
            done();
        });
    }
    
    // get emails, send notifications.
    var sendEmailToUsers = function (booking, done) {
        
        var receivers = [];
        booking
        .populate('owner')
        .populate('personnel.shared_users', function (err, booking) {
            receivers = receivers.concat(booking.personnel.shared_users);
            
            if  (booking.owner && booking.owner.email) {
                receivers.unshift(booking.owner);
            }
            
            async.mapSeries(receivers, function (user, nextUser) {
                sendEmailSingleUser(user, nextUser);
            }, done);
        });   
    }
    
    BookingEmailNotification.findByBookingId(booking._id, function (err, bEmailNotification) {
        // notification has been sent, exit.
        if (bEmailNotification && bEmailNotification.sent_at) {
            return callback(null, false, bEmailNotification);
        }
        
        sendEmailToUsers(booking, function () {
            if (bEmailNotification) {
                bEmailNotification.sent_at = new Date();
                return bEmailNotification.save(function (err, result) {
                    callback(err, true, result);
                });
            }
            
            BookingEmailNotification.create({
                "booking": booking._id,
                "sent_at": new Date()
            }, function (err, result) {
                callback(err, true, result);
            });
        });
    });
}

module.exports = {
    "sendMailForSharedUsers": sendMailForSharedUsers,
    "sendEmailConfirmationToOwner": sendEmailConfirmationToOwner,
    "sendEmailUpdateBooking": sendEmailUpdateBooking,
    "sendEmailReminder": sendEmailReminder
};