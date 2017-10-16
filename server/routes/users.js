var express = require('express');
var router = express.Router();
var _ = require('lodash');
var mongoose = require('mongoose');
var User = require('../models/user');
var Booking = mongoose.model("Booking");
var UserSetting = mongoose.model("UserSetting");
var isLoggedIn = require('../middlewares/isLoggedIn');

var listAdrMixer = function (req, res, next) {
    // find all adr mixer
    User.find({"isAdrMixer": true}, function (err, users) {
        formatted_users = _.map(users, function(user) {
            if (!user.fullname) {
                user.fullname = user.email.substr(0, user.email.indexOf("@"))
            }
            return user;
        })
        res.json({
            "data": formatted_users
        });
    });
};

function searchUser(req, res) {
    var searchKey = req.query.field || '_id';
    var searchValue = req.query.value || '';
    var user = req.user;
    var production = req.query.production || '';

    if (searchKey && searchValue) {
        var filters = {};
        filters[searchKey] = new RegExp("^" + searchValue);
        if (user && user.role == 'admin') {
            User.find(filters, "email _id profilePhoto profileType fullname", function (err, users) {
              return res.json({
                  "data": users
              });
            });
        } else {
            var booking_filters = { production: new RegExp(production, 'i') };
            if (user) booking_filters['owner'] = user._id.toString();
            Booking.find(booking_filters).populate('personnel.shared_users', 'email _id profilePhoto profileType fullname').exec(function(err, bookings) {
                if(err) {
                    return res.json({
                        data: []
                    });
                }
                var users = [];
                var email_regex = new RegExp("^" + searchValue);
                bookings.forEach(function(booking) {
                    booking.personnel.shared_users.forEach(function(user) {
                        if(email_regex.test(user.email)) {
                            users.push(user);
                        }
                    });
                });
                users = _.uniqBy(users, '_id');
                return res.json({
                    data: users
                });
            }) ;
        }

    } else {
        return res.json({
            "data": []
        });
    }
}

function getUserSettings(req, res) {
    var userId = req.user._id.toString();
    var key = req.query.key;
    UserSetting.findOne({userId: userId, key: key}, function (err, data) {
        var setting = null;
        if (data) {
            setting = data.value;
        }
        return res.json({
            "data": setting
        });
    })

}

function setUserSettings(req, res) {
    var userId = req.user._id.toString();
    var key = req.body.key;
    var value = req.body.value;

    UserSetting.findOne({
        userId: userId,
        key: key
    }, function (err, setting) {
        if (setting) {
            setting.set({value: value});
            setting.save(function () {
                return res.json({
                    "success": true
                });
            })
        } else {
            UserSetting.create({
                userId: userId,
                key: key,
                value: value
            }, function () {
                return res.json({
                    "success": true
                });
            });
        }
    });
}

function updateUser(req, res)
{
    var user = req.user;
    user.set(req.body);
    user.save(function () {
        res.json(user);
    });
}

var list = function(req, res) {
    var userId = req.user._id.toString();
    var pagination = { page: 1, limit: 10 };
    var q = req.query.q || '';
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 10;
    var role = req.query.role || '';
    var filter = { _id: { $ne: userId }, $or: [{ fullname: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] };
    var field = req.query.sort || 'fullname';
    var order = req.query.order == 'asc' ? 1 : -1;
    var sort = {}; sort[field] = order;
    if (role != '') {
        filter['role'] = role;
    }
    if( req.query.is_adr_mixer && (req.query.is_adr_mixer == true || req.query.is_adr_mixer == 'true') ) {
        filter['isAdrMixer'] = true;
    }
    User.paginate(filter, { page: page, limit: limit, sort: sort }).then(function(result) {
        return res.json({
            data: result
        });
    });
};

var update = function(req, res) {
    var userId = req.params.id;
    var userParams = req.body;
    User.findOne({ _id: userId }).exec(function(err, user) {
        if (!err && user) {
            _.assign(user, userParams);
            user.save(function(err) {
                if (!err) {
                    return res.json({
                        data: user
                    });
                } else {
                    return res.json({
                        data: null
                    });
                }
            });
        } else {
            return res.json({
                data: null
            });
        }
    });
};

var destroy = function(req, res) {
    var userId = req.params.id;
    User.findOne({ _id: userId }, function(err, user) {
        if (err) {
            return res.sendStatus(500);
        }
        if (!user) {
            return res.sendStatus(404);
        }
        user.remove(function(err) {
            if (err) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });
};

router.get('/search', isLoggedIn, searchUser);

router.get('/adr-mixers', listAdrMixer);

router.get('/settings', isLoggedIn, getUserSettings);

router.put('/settings', isLoggedIn, setUserSettings);

router.put('/me', isLoggedIn, updateUser);

router.get('/', isLoggedIn, list);

router.put('/:id', isLoggedIn, update);

router.delete('/:id', isLoggedIn, destroy);

module.exports = router;
