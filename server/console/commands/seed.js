/**
 * Provide seed data command
 * Usage:
 *  NODE_ENV=<enviroment> node bin/cli.js seed
 * 
 * Define seeders on <root_app>/seeders
 * 
 */
'use strict';

var commander = require('commander');
var seedMongoose = require('seed-mongoose');
var mongoose = require('mongoose');
var config = require('config');

commander
.command('seed')
.description('Run seed to db database') 
.action(function(env, options) {
    var seeder = seedMongoose({
        path: 'seeders',
    });
    
    seeder.load(function () {
        process.exit();
    });
});