'use strict';

var mongoose = require('mongoose');
var _ = require('lodash');
var config = require("config");

var Schema = mongoose.Schema;
var BookingSchema = new Schema({
    time_in: Date,
    time_out: Date,
    title: String,
    booking_status: {
        type: String,
        enum: ["Book", "Hold"]
    },
    production: String,
    episode_number: String,
    post_production_name: String,
    post_production_phone: String,
    post_production_email: String,
    actors: [
        {
            name: String,
            start_time: String
        }
    ],
    event_logs: [
        {
            start_time: String,
            description: String,
            end_time: String,
            rate: Number,
            setup_fee: Number,
            is_billed: Boolean
        }
    ],
    additional_charges: [
        {
            amount: String,
            description: String
        }
    ],
    additional_information: String,
    food_request: Boolean,
    food_request_details: String,
    estimate: Number,
    purchase_number: String,
    personnel: {
        adr_mixer: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        shared_users: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    technical_specifications: {
        sample_rate: String,
        frame_rate: String,
        preferred_microphones_boom: String,
        lavalier: String,
        clients: [
            {
                title: String,
                value: String
            }
        ],
        client_info: String,
        instructions: String,
        deliverables: [
            {
                content: String,
                done: Boolean
            }
        ],
        local_or_remote_actor_and_director: String
    },
    billing: {
        billing_address: String,
        contact_details: String
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    notice: String
}, {'collection': 'bookings', versionKey: false});

BookingSchema.static('hasBooking', function (timeIn, timeOut, exceptId, callback) {

    if ("Date" != typeof timeIn) {
        timeIn = new Date(timeIn);
    }

    if ("Date" != typeof timeOut) {
        timeOut = new Date(timeOut);
    }

    var query = {
        "booking_status": "Book",
        "$or": [
            {"time_in": {"$gt": timeIn, "$lt": timeOut}},
            {"time_out": {"$gt": timeIn, "$lt": timeOut}},
            {"time_in": {"$lte": timeIn}, "time_out": {"$gte": timeOut}}
        ]
    };

    if ( exceptId && "string" == typeof exceptId) {
        query._id = {
            "$ne": new mongoose.Types.ObjectId(exceptId)
        }
    } else if (exceptId) {
        query._id = {
            "$ne": exceptId
        };
    }

    this.count(query, function (err, count) {
        callback( count > 0 );
    });
});

BookingSchema.method("canUpdate", function (user) {

    if (this.isOwner(user) || this.isShared(user)) {
        var today = new Date();
        today.setHours(0,0,0,0);
        if (this.time_in > today) {
            return true;
        }
    }

    return user.isAdmin();
});

// check user can remove the booking
BookingSchema.method("canDelete", function (user) {
    return this.isOwner(user) || user.isAdmin();
});

// Check user is owner of the booking
BookingSchema.method("isOwner", function (user) {
    return this.owner.equals(user.id);
});

// check user has been share the booking
BookingSchema.method("isShared", function (user) {
    return this.personnel.shared_users.some(function (shareUser) {
        return shareUser.equals(user.id);
    });
});

BookingSchema.method('shareToUsers', function (userIds, callback) {
    var User = this.model('User');
    var booking = this;

    User.find({"_id": {"$in": userIds}}, function (err, users) {
        var validUserIds = _.map(users, "_id");
        var addUserIds = booking.personnel.shared_users.addToSet.apply(booking.personnel.shared_users, validUserIds);

        booking.save(function (err) {
            User.find({"_id": {"$in": addUserIds}}, function (err, addUsers) {
               callback(err, addUsers);
            });
        });
    });
});

BookingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

mongoose.model('Booking', BookingSchema);
