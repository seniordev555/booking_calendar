var gulp = require('gulp');

var config = require('../gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;

// Copy main application
gulp.task('app', function () {
    return gulp
            .src(['./app/layout/*.*', './app/book/**/*.*'], {base: './'})
            .pipe(gulp.dest(destinationFolder))
    ;
});