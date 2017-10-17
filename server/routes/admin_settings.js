var express = require('express'),
    router = express.Router(),
    _ = require('lodash'),
    AdminSetting = require('../models/admin_setting'),
    isLoggedIn = require('../middlewares/isLoggedIn');

var show = function(req, res) {
  AdminSetting.findOne().exec(function(err, admin_setting) {
    if(err) {
      return res.sendStatus(500);
    }

    var settings = admin_setting || {};

    return res.json({ data: settings });
  });
};

var update = function(req, res) {
  var settingsParams = _.omit(req.body, '_id');
  AdminSetting.findOne().exec(function(err, admin_setting) {
    if(err) {
      return res.sendStatus(500);
    }
    if(!admin_setting) {
      admin_setting = new AdminSetting(settingsParams);
    } else {
      admin_setting = _.assign(admin_setting, settingsParams);
    }
    // sort microphones
    admin_setting.microphones = admin_setting.microphones || [];
    admin_setting.microphones = _.sortBy(admin_setting.microphones);
    admin_setting.save(function(err) {
      if(err) {
        return res.sendStatus(500);
      }
      return res.json({ data: admin_setting });
    });
  });
};

router.get('/', show);

router.put('/', isLoggedIn, update);

module.exports = router;
