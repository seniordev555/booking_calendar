'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AdminSettingSchema = new Schema({
  title: String,
  location: String,
  address: String,
  email: String,
  phone: String,
  microphones: [String],
  local_or_remote_actor_and_directors: {
    local_actor_director: { type: Boolean, default: false },
    local_actor_with_remote_director: { type: Boolean, default: false },
    local_director_with_remote_actor: { type: Boolean, default: false }
  }
}, { strict: false, collection: "admin-settings" });

module.exports = mongoose.model('AdminSetting', AdminSettingSchema);
