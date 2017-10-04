'use strict';

var _ = require('lodash');
var config = require('config');

module.exports = _.assign({}, {
  url: config.get('db'),
  directory: "./migrations"
});
