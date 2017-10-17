'use strict';

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    "profileId": String,
    "fullname": String,
    "profileType": String,
    "profileUrl": String,
    "profileAccessToken": String,
    "profilePhoto": String,
    "email": String,
    "role": {type: String, default: "user"},
    "isEmpty": {type: Boolean, default: false},
    "isAdrMixer": {type:Boolean, default: false},
    "emailNotifications": {
        "bookingUpdated": {
            type: Boolean, default: true
        },
        "bookingCreated" : {
            type: Boolean, default: true
        },
        "bookingRemind": {
            type: Boolean, default: true
        },
        "newSharedBooking": {
            type: Boolean, default: true
        }
    },
    last_sign_in_at: Date
}, {strict: false, collection: "users"});

// Validate role field
var validRoles = ['admin', 'user'];
var roleValidator = function (role) {
    return validRoles.indexOf(role) > -1;
}
var roleValidationFailedMsg = "The {PATH} field does not exist in " + validRoles.join(",") + ".";
UserSchema.path('role').validate({"validator": roleValidator, "msg": roleValidationFailedMsg});


UserSchema.method('isAdmin', function () {
    return 'admin' == this.get("role");
});

UserSchema.method('wantReceiveNotification', function (setting) {
    return (this.emailNotifications && true == this.emailNotifications[setting]);
});

UserSchema.method('wantReceiveEmailBookingUpdated', function () {
    return this.wantReceiveNotification('bookingUpdated');
});

UserSchema.method('wantReceiveEmailBookingCreated', function () {
    return this.wantReceiveNotification('bookingCreated');
});

UserSchema.method('wantReceiveEmailSharedBooking', function () {
    return this.wantReceiveNotification('newSharedBooking');
});
UserSchema.method('wantReceiveEmailBookingRemind', function () {
    return this.wantReceiveNotification('bookingRemind');
});

UserSchema.static('findBySocialId', function (socialType, socialId, callback) {
    return this.findOne({"profileType": socialType, "profileId": socialId}, callback);
});

UserSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', UserSchema);
