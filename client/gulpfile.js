var gulp = require('gulp');
var replace = require('gulp-replace');
var rimraf = require('gulp-rimraf');
var runSequence = require('run-sequence');

var config = require('./gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;

require('require-dir')('gulptask');

// Clean all before building
gulp.task('cleanAll', function () {
    return gulp.src(destinationFolder).pipe(rimraf());
});

gulp.task('default', ['cleanAll'], function () {
    runSequence('index:fix_path', 'minify', 'components', 'ga');
});