/**
 * CLI App
 * 
 * Prepare config, models, environment, create connection with database
 * Provide environment & add commands* 
 */
'use strict';
// Require modules
var mongoose = require("mongoose");
var config = require('config');
var _ = require('lodash');

mongoose.connect(config.get('db'));

// require models
require("../models/user");
require("../models/booking");
require("../models/booking-email-notification");

// require commands
require('./commands/seed');
require('./commands/reminder');

var commander = require('commander');
commander.parse(process.argv);

var commands = _.map(commander.commands, '_name');

if (
    !process.argv.slice(2).length || 
    (typeof commander.args[0] == 'string' && commands.indexOf(commander.args[0]) == -1)
) {
    commander.help();
}