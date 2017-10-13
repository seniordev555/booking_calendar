'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AdminSettingSchema = new Schema({
  key: String,
  value: String
}, { strict: false, collection: "admin-settings" });

mongoose.model('AdminSetting', AdminSettingSchema);
