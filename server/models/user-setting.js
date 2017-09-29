'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSettingSchema = new Schema({
    "userId": String,
    "key": String,
    "value": String
}, {strict: false, collection: "user-settings"});

mongoose.model('UserSetting', UserSettingSchema);