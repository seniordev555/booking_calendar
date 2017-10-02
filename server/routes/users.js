var express = require('express');
var router = express.Router();
var _ = require('lodash');
var mongoose = require('mongoose');
var User = mongoose.model("User");
var Booking = mongoose.model("Booking");
var UserSetting = mongoose.model("UserSetting");
var isLoggedIn = require('../middlewares/isLoggedIn');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

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

    if (searchKey && searchValue) {
        var filters = {};
        filters[searchKey] = new RegExp("^" + searchValue);
        return User.find(filters, "email _id profilePhoto profileType fullname", function (err, users) {
            res.json({
                "data": users
            });
        });
    }

    return res.json({
        "data": []
    });

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

function listSharedUsers(req, res) {
    var userId = req.user._id.toString();
    var shared_users = [];
    Booking.find({ owner: userId }).populate('personnel.shared_users').exec(function(err, bookings) {
        if (!err) {
            _.each(bookings, function(booking) {
                _.each(booking.personnel.shared_users, function(user) {
                    shared_users.push(user)
                });
            });
            shared_users = _.union(shared_users, 'email');
        }
        res.json({
            data: shared_users
        });
    });
}

router.get('/search', searchUser);

router.get('/adr-mixers', listAdrMixer);

router.get('/settings', isLoggedIn, getUserSettings);

router.put('/settings', isLoggedIn, setUserSettings);

router.put('/me', isLoggedIn, updateUser);

router.get('/shared-users', isLoggedIn, listSharedUsers);

module.exports = router;
