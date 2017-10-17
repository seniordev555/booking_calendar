'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AdminSettingSchema = new Schema({
  title: String,
  location: String,
  address: String,
  email: String,
  phone: String,
  microphones: [String]
}, { strict: false, collection: "admin-settings" });

module.exports = mongoose.model('AdminSetting', AdminSettingSchema);
