var express = require('express');
var router = express.Router();
var isLoggedIn = require('../middlewares/isLoggedIn');
var logger = require('winston');
var mongoose = require('mongoose');
var Booking = mongoose.model('Booking');
var User = mongoose.model("User");
var _ = require('lodash');
var async = require('async');
var mailer = require("../helpers/mailer");
var BookingHasher = require('../helpers/booking-hasher');
var moment = require('moment');
var validator = require("validator");

var BookingMailer = require('../helpers/booking-mailer');
var sendMailForSharedUsers = BookingMailer.sendMailForSharedUsers;
var sendEmailConfirmationToOwner = BookingMailer.sendEmailConfirmationToOwner;
var sendEmailUpdateBooking = BookingMailer.sendEmailUpdateBooking;
var sendEmailDeleteBooking = BookingMailer.sendEmailDeleteBooking;

function createNewBooking(data, callback)
{
    var booking = new Booking(data);
    booking.owner = data.user.id;
    booking.personnel.adr_mixer = null;
    if (data.personnel && data.personnel.adr_mixer && data.personnel.adr_mixer._id) {
        booking.personnel.adr_mixer = data.personnel.adr_mixer._id;
    }
    booking.save(function (err, results) {
        if (err && err.errors) {
            callback({error: err.errors});
        }

        sendEmailConfirmationToOwner(booking, function () {
            callback(null, booking);
        });
    });
}

function transformSingleBooking(booking, user)
{
    if (!user || ! booking.canUpdate(user) ) {
        return {
            "_id": booking._id,
            "booking_status": booking.booking_status,
            "time_in": booking.time_in,
            "time_out": booking.time_out,
            "estimate": booking.estimate,
            "owner": {
                "_id": booking.owner._id
            },
            "can_update": false
        };
    }

    var data = booking.toJSON();
    data.can_update = booking.canUpdate(user);
    return data;
}

// send email to booking's partners
function shareBooking(req, booking, userIds, emails, callback)
{
    function shareWithUsers(userIds, shareUsersDoneCb) {
        User.find({"_id": {"$in": userIds}}, function (err, users) {
            // Find new shared users
            var addedUsers =  _.filter(users, function (user) {
                return ! booking.isShared(user);
            });

            booking.shareToUsers(addedUsers, function () {
                sendMailForSharedUsers(addedUsers, booking, shareUsersDoneCb);
            });
        });
    }

    function shareWithEmails(emails, sharedEmailDoneCb) {
        // create empty users.
        var newUserIds = [];
        async.eachSeries(emails, function (email, nextEmailCb) {
            if ( ! validator.isEmail(email) ) {
                return nextEmailCb();
            }

            User.create({
                "email": email,
                "isEmpty": true
            }, function (err, user) {
                newUserIds.push(user.id);
                nextEmailCb();
            });
        }, function createEmptyUserDone(err) {
            // link users to booking
            booking.shareToUsers(newUserIds, function (err, users) {
                // send mail to users
                sendMailForSharedUsers(users, booking, sharedEmailDoneCb);
            });
        });
    }

    async.series({
        "shareWithUsers": function (next) {
            shareWithUsers(userIds, next);
        },
        "shareWithEmails": function (next) {
            shareWithEmails(emails, next);
        }
    }, function () {
        callback();
    });
}

function create(req, res){

    Booking.hasBooking(req.body.time_in, req.body.time_out, null, function (hasBooking) {
        if (hasBooking && 'Book' == req.body.booking_status ) {
            return res.status(400).json({
                error: "The time you have attempted to book has already been confirmed by another client, please choose another time."
            });
        }

        var data = req.body;
        data.user = {
            id: req.user.id
        };

        // We handled share users in another flow.
        var sharedUsers = [];
        if (data.personnel && data.personnel.shared_users) {
            sharedUsers = data.personnel.shared_users;
            delete data.personnel.shared_users;
        }

        createNewBooking(data , function (err, booking) {
            if (err) {
                return res.status(400).json(err);
            }

            booking.populate('personnel.adr_mixer', function () {
                var data = booking.toJSON();

                data.owner = {
                    _id: req.user.id,
                    profilePhoto: req.user.profilePhoto,
                    profileUrl: req.user.profileUrl
                };

                if (!req.body.personnel || ( ! sharedUsers.length && ! req.body.personnel.shared_emails) ) {
                    return res.json(data);
                }

                var emails = req.body.personnel.shared_emails || [];
                shareBooking(req, booking, sharedUsers, emails, function () {
                    booking
                    .populate("personnel.adr_mixer")
                    .populate("owner", "_id profilePhoto profileUrl")
                    .populate("personnel.shared_users", function (err, booking) {
                        var data = transformSingleBooking(booking, req.user);
                        res.json(data);
                    });
                });
            });
        });
    });

}

/**
 * Admin can update all booking without time constraint
 * Owner can update his own booking except booking in the past
 *
 * @param {object} req
 * @param {object} res
 * @returns {object}
 */
function update(req, res) {
    var id = req.params.id;
    Booking.findById(id, function(err, booking){
        if (err) {
            logger.info(err);
            return err;
        }

        if (!booking) {
            return res.status(404).send();
        }

        var canUpdate = booking.canUpdate(req.user);
        if (!canUpdate) {
            return res.status(403).send();
        }

        Booking.hasBooking(req.body.time_in, req.body.time_out, id, function (hasBooking) {
            if (hasBooking && 'Book' == req.body.booking_status ) {
                return res.status(400).json({
                    error: "The time is not available"
                });
            }

            var data = req.body;
            // We handled share users in another flow.
            var sharedUsers = [];
            if (data.personnel && data.personnel.shared_users) {
                sharedUsers = data.personnel.shared_users;
                delete data.personnel.shared_users;
            }
            booking.set(data);
            if (req.body.actors_name) {
                booking.actors_name = req.body.actors_name;
            }

            async.series({
                "saveBooking": function (next) {
                    booking.save(function (err) {
                        next(err);
                    });
                },
                "sentEmailUpdateBooking": function (next) {
                    sendEmailUpdateBooking(booking, function () {
                        next();
                    });
                },
                "shareBooking": function (next) {
                    var emails = req.body.personnel.shared_emails || [];
                    shareBooking(req, booking, sharedUsers, emails, function () {
                        next();
                    });
                }
            }, function (err) {
                if (err) {
                    return res.status(500).send();
                }

                booking
                .populate("personnel.adr_mixer")
                .populate("owner", "_id profilePhoto profileUrl")
                .populate("personnel.shared_users", function (err, booking) {
                    var data = transformSingleBooking(booking, req.user);
                    res.json(data);
                });
            });
        });
    });
}

function list(req, res) {

    var ownerFields = "_id";
    var isAdmin = (req.user && req.user.isAdmin()) ? true : false;
    var isUser = (req.user && ! req.user.isAdmin()) ? true : false;
    var isGuest = ( ! req.user );
    var hasUser = req.user ? true : false;
    // only fetch bookings within a range of date (the current time range of the full calendar)
    // these are bookings have time_in or time_out within the range
    var start = req.query.start ? new Date(req.query.start) : null;
    var end = req.query.end ? new Date(req.query.end) : null;
    var duration = moment.duration(end - start);
    var isWeekChecking = duration.asDays() > 1 ? true : false;

    var firstDayOnCurrentWeek = moment().startOf("week");
    var isViewPastBooking = false;
    var filters = {};
    var now = new Date();

    if (hasUser) {
        ownerFields = "profileUrl profilePhoto _id";
    }

    if (end) {
        if (isWeekChecking) {
            var firstDayOfEndDateWeek = moment(end).startOf("week");
            // Should add 1 second on current week for better results
            isViewPastBooking = firstDayOnCurrentWeek.add(1, "seconds").isAfter(firstDayOfEndDateWeek);
        } else {
            isViewPastBooking = moment().add(1, "seconds").isAfter(moment(end));
        }
    }

    // Guest are not allowed to view historical.
    // Request with start date & end date in historical
    if (isViewPastBooking && isGuest) {
        return res.json({"data": []});
    }

    // Request with start date < current < end date
    // Guest can't see bookings in historical
    if ( isGuest && isWeekChecking && moment(now).isAfter(start) && moment(now).isBefore(end)) {
        start = now;
    }

    if (start && end) {
        filters = { '$or': [
                {
                    time_in : { $gte: start, $lte: end }
                },
                {
                    time_out : { $gte: start, $lte: end }
                }
            ]
        };
    } else if (start) {
        filters = {
            '$or': [
                {
                    time_in: {$gte: start}
                },
                {
                    time_out: {$gte: start}
                }
            ]
        }
    } else if (end) {
        filters = {
            '$or': [
                {
                    time_in: {$lte: end}
                },
                {
                    time_out: {$lte: end}
                }
            ]
        }
    }

    if (isUser) {
        // User only can view their owned bookings in history
        if (isViewPastBooking) {
            filters.owner = req.user.id;
        } else {
            // User only can view their owned bookings or bookings with status is book.
            filters.$and = [
                {
                    '$or': [
                        {
                            "owner": req.user.id
                        },
                        {
                            "booking_status": "Book"
                        }
                    ]
                }
            ];
        }
    } else if (isGuest) {
        filters.booking_status = "Book";
    }

    Booking.find(filters)
    .populate("owner", ownerFields)
    .populate("personnel.shared_users", "_id email fullname profilePhoto profileUrl")
    .populate("personnel.adr_mixer", "_id email fullname profilePhoto")
    .exec(function(err, results){

        if (err) {
            logger.info(err);
            return err;
        }

        var data = [];
        results.forEach(function (booking) {
            data.push(transformSingleBooking(booking, req.user));
        })

        res.json({
            data: data,
        });
    });
}

function remove (req, res) {
    var id = req.params.id;
    Booking.findById(id)
    .populate("owner personnel.adr_mixer personnel.shared_users")
    .exec(function(err, booking){
        if (err) {
            logger.info(err);
            return err;
        }
        if (!booking) {
            return res.status(404).send();
        }

        var canDelete = booking.canDelete(req.user);

        if (!canDelete) {
            return res.status(403).send();
        }
        booking.remove(function (err, results) {
            if (err) {
                logger.info(err);
                return err;
            }
            sendEmailDeleteBooking(booking, function() {
                res.json({"success": true});
            });
        });
    });
}

function singleBooking (req, res) {
    var id = req.params.id;

    Booking.findById(id)
    .populate("owner", 'profileUrl profilePhoto _id')
    .populate("personnel.shared_users", "_id email fullname profilePhoto")
    .populate("personnel.adr_mixer", "_id email fullname profilePhoto")
    .exec(function (err, booking) {
        if (err) {
            logger.info(err);
            return err;
        }

        if (!booking) {
            return res.status(404).send();
        }

        res.json(transformSingleBooking(booking, req.user));
    });
}

function listRecentAdrMixers(req, res) {
    var getRecentAdrMixerByUserId = function (userId, callback) {
        Booking
        .find({"owner": userId})
        .limit(15)
        .sort({"_id": -1})
        .exec(function (err, bookings) {
            var recentAdrMixerIds = [];
            bookings.forEach(function (booking) {
                recentAdrMixerIds.push(booking.personnel.adr_mixer);
            });

            recentAdrMixerIds = _.uniq(recentAdrMixerIds);

            if ( _.isEmpty(recentAdrMixerIds)) {
                return callback([]);
            }

            User.find({"_id": {"$in": recentAdrMixerIds}}, function (err, mixers) {
                callback(mixers);
            });
        });
    };

    // Admin User
    if (req.user && req.user.isAdmin() && req.query.booking_id) {
        Booking.findById(req.query.booking_id, function (err, booking) {
            getRecentAdrMixerByUserId(booking.owner, function (mixers) {
                res.json({"data": mixers});
            });
        });
    } else if (req.user) {
        getRecentAdrMixerByUserId(req.user.id, function (mixers) {
            res.json({"data": mixers});
        });
    } else {
        res.json({"data": []});
    }
}

function getLastBooking(req, res) {
    var userId = req.user._id;
    Booking.find({owner: userId}).sort({'created_at': -1}).limit(1).populate('personnel.shared_users').exec(function(err, bookings) {
        if (err) {
            return res.json({ data: null });
        }
        if ( bookings && bookings.length == 1) {
            res.json({ data: bookings[0] });
        } else {
            res.json({ data: null });
        }
    });
}

var searchActors = function(req, res) {
  var production = req.query.production || '';
  var name = req.query.name || '';
  var userId = req.user._id;
  var filters = { owner: userId };
  var actors = [];
  filters['production'] = new RegExp(production, 'i');
  filters['actors'] = { $elemMatch: { name: new RegExp(name, 'i') } };
  Booking.find(filters).sort({ created_at: -1 }).exec(function(err, bookings) {
    if (err) {
      return res.json({ data: actors });
    }
    bookings.forEach(function(booking) {
      if (booking.actors && booking.actors.length > 0) {
        actors = _.union(actors, booking.actors, 'name');
      }
    });
    return res.json({ data: actors });
  });
};

router.post('/', isLoggedIn, create);
router.put('/:id', isLoggedIn, update);
router.get('/', list);
router.get('/last-booking', isLoggedIn, getLastBooking);
router.get('/recent-adr-mixers', isLoggedIn, listRecentAdrMixers);
router.get('/search-actors', isLoggedIn, searchActors);
router.get('/:id', isLoggedIn, singleBooking);
router.delete('/:id', isLoggedIn, remove);

module.exports = router;
