'use strict';

var logger = require('winston');

module.exports = function (req, res, next) {
    if (req.user) {
        next();
    } else {
        res.status(403).json({'error': 'Permission denied'});
    }
};
