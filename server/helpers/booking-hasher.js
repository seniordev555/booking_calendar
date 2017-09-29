
var config = require('config');
var jwt = require('jsonwebtoken');
var User = require("mongoose").model("User");

var BookingHasher = {
    "createTokenForUser": function (booking, user) {
        var payload = {
            "bookingId": booking.id,
            "userId": user.id
        };
        
        return jwt.sign(payload, config.session.secret);
    },
    "getUserByToken": function (token, callback) {
        jwt.verify(token, config.session.secret, function (err, payload) {
            
            if (!payload) {
                return callback();
            }
            
            User.findById(payload.userId, function (error, user) {
                callback(user);
            });
        });
    },
    "getBookingIdByToken": function (token, callback) {
        jwt.verify(token, config.session.secret, function (err, payload) {
            
            if (!payload) {
                return callback();
            }
            callback(payload.bookingId);
        });
    }
};

module.exports = BookingHasher;