#!/usr/bin/env node

// Change to app root folder (this step allow execution cli app from crontab)
process.chdir(require('path').dirname(__dirname));

require(__dirname + '/../console/app');