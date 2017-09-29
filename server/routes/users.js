var express = require('express');
var router = express.Router();
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
        res.json({
            "data": users
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

router.get('/search', searchUser);

router.get('/adr-mixers', listAdrMixer);

router.get('/settings', isLoggedIn, getUserSettings);

router.put('/settings', isLoggedIn, setUserSettings);

router.put('/me', isLoggedIn, updateUser);

module.exports = router;
