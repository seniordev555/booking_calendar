'use strict';

var config = require('config');

module.exports = {
  "url": config.get('db'),
  "directory": "./migrations"
};
