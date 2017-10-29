/*
 * Authentication
 */
'use strict';

var authCommon = {};
var mongoose = require('mongoose');
var User = mongoose.model("User");
var Booking = mongoose.model("Booking");
var BookingHasher = require('../helpers/booking-hasher');

/**
 * Add client social account to database
 *
 * @param {object} profile
 * {
        'profileId': 'id of external social network',
        'displayName' : 'display name of external social network',
        'profileType': 'facebook/linkedin/google',
        'accessToken': '',
        'profilePhoto': 'photo url of external social network'
    }

 * @param {callback} done
 * This is the callback of PassportJs
 */
authCommon.addUserToDb = function(profile, done) {
    User.findBySocialId(profile.profileType, profile.profileId, function (err, user) {
        if (err) {
            return done(err);
        }
        var role = ['jacekmdev@gmail.com', 'robnokes@gmail.com'].includes(profile.email) ? 'admin' : 'user';
        if (user) {
            user.set({
                'profilePhoto': profile.profilePhoto,
                'fullname': profile.displayName,
                'profileAccessToken': profile.accessToken,
                'profileUrl': profile.profileUrl,
                'email': profile.email,
                "isEmpty": false,
                last_sign_in_at: new Date()
            });
            user.save(function (err, res) {
                done(null, user);
            });
        } else {
            User.create({
                'profileId': profile.profileId,
                'profileType': profile.profileType,
                'profileAccessToken': profile.accessToken,
                'fullname': profile.displayName,
                'profilePhoto': profile.profilePhoto,
                'profileUrl': profile.profileUrl,
                'email': profile.email,
                "isEmpty": false,
                'role': role,
                last_sign_in_at: new Date()
            }, function (err, user) {
                done(null, user);
            });
        }
    });
}

authCommon.authenticated = function (req, profile, callback) {
    if (req.session && req.session.userId && req.session.bookingId) {
        User.findBySocialId(profile.profileType, profile.profileId, function (err, user) {
            // User already existed
            // Remove temp user
            // Share booking for existed user.
            if (user) {
                authCommon.addUserToDb(profile, function (err, user) {
                    Booking.findById(req.session.bookingId, function (err, booking) {
                        booking.personnel.shared_users.remove(req.session.userId);
                        booking.personnel.shared_users.addToSet(user._id);
                        booking.save(function () {
                            User.findByIdAndRemove(req.session.userId, function () {
                                delete req.session.userId;
                                callback(null, user);
                            });
                        });
                    });
                });
            } else {
                authCommon.linkToUser(req.session.userId, profile, function (err, user) {
                    delete req.session.userId;
                    callback(null, user);
                });
            }
        });
    } else {
        authCommon.addUserToDb(profile, callback);
    }
};

authCommon.linkToUser = function (userId, profile, callback) {
    User.findById(userId, function (err, user) {
        user.set({
            'profileId': profile.profileId,
            'profileType': profile.profileType,
            'profileAccessToken': profile.accessToken,
            'fullname': profile.displayName,
            'profilePhoto': profile.profilePhoto,
            'profileUrl': profile.profileUrl,
            'email': profile.email,
            "isEmpty": false,
            last_sign_in_at: new Date()
        });

        user.save(function () {
            callback(null, user);
        });
    });
}

authCommon.getBookingRedirectUrl = function (req) {
    var redirectUrl = require('config').get("baseUrl");
    if (req.session.bookingId) {
        redirectUrl += "#/booking/" + req.session.bookingId;
        delete req.session.bookingId;
    }

    return redirectUrl;
}

// Middleware retrieved invitation token & storage to session before authenticate with external services.
authCommon.invitationTokenReceiver = function (req, res, next) {
    var async = require("async");

    if (! req.query.invitation_token) {
        return next();
    }

    async.series({
        user: function (callback) {
            BookingHasher.getUserByToken(req.query.invitation_token, function (user) {
                if (!user) {
                    return callback();
                }

                req.session.userId = user.id;
                callback();
            });
        },
        bookingId: function (callback) {
            BookingHasher.getBookingIdByToken(req.query.invitation_token, function (bookingId) {
                if (!bookingId) {
                    return callback();
                }
                req.session.bookingId = bookingId;
                callback();
            });
        }
    }, function done (err) {
        next();
    });
};

module.exports = authCommon;

