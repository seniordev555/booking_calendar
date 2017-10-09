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

var list = function(req, res) {
    var userId = req.user._id.toString();
    var pagination = { page: 1, limit: 10 };
    var q = req.query.q || '';
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 10;
    var role = req.query.role || '';
    var filter = { _id: { $ne: userId }, $or: [{ fullname: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] };
    if (role != '') {
        filter['role'] = role;
    }
    if( req.query.is_adr_mixer && (req.query.is_adr_mixer == true || req.query.is_adr_mixer == 'true') ) {
        filter['isAdrMixer'] = true;
    }
    User.paginate(filter, { page: page, limit: limit, sort: { isAdrMixer: -1, role: 1 } }).then(function(result) {
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

router.get('/search', searchUser);

router.get('/adr-mixers', listAdrMixer);

router.get('/settings', isLoggedIn, getUserSettings);

router.put('/settings', isLoggedIn, setUserSettings);

router.put('/me', isLoggedIn, updateUser);

router.get('/', isLoggedIn, list);

router.put('/:id', isLoggedIn, update);

module.exports = router;
