var gulp = require('gulp');
var templateCache = require('gulp-angular-templatecache');

var config = require('../gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;


// caching template for angular
gulp.task('cache', function () {
  return gulp
            .src('./app/**/*.html')
            .pipe(templateCache({
                filename: 'templates.js',
                module: 'newApp',
                root: './app'
            }))
            .pipe(gulp.dest(destinationFolder))
    ;
});
