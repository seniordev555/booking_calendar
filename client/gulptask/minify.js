var gulp = require('gulp');
var merge2 = require('merge2');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');

var config = require('../gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;

// Minify
gulp.task('minify', function () {
    var minifyCss = gulp
            .src(destinationFolder + '/styles*.css')
            .pipe(cssnano())
            .pipe(gulp.dest(destinationFolder))
    ;
    var minifyJs = gulp
            .src(destinationFolder + '/scripts*.js')
            .pipe(ngAnnotate())
            .pipe(uglify({mangle: true}))
            .pipe(gulp.dest(destinationFolder))
    ;
    return merge2(minifyCss, minifyJs);
});