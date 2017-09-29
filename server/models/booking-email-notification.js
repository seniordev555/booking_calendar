'use strict';
var mongoose = require('mongoose');

// Define schema
var Schema = mongoose.Schema;

var BookingEmailNotificationSchema = new Schema({
    "booking": {
        "type": Schema.Types.ObjectId,
        "ref": "Booking"
    },
    "sent_at": Date,
    "created_at": {
        "type": Date,
        "default": Date.now
    }
}, {
    collection: "booking_email_notifications"
});

BookingEmailNotificationSchema.static('findByBookingId', function (bookingId, callback) {
    return this.findOne({"booking": bookingId}, callback);
});

var BookingEmailNotification = mongoose.model("BookingEmailNotification", BookingEmailNotificationSchema);