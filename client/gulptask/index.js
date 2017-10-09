var gulp = require('gulp');
var useref = require('gulp-useref');
var RevAll = require('gulp-rev-all');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
var merge2 = require('merge2');

var config = require('../gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;

require('./app');
require('./cache');
require('./less');

// Merge styles and scripts into one file
gulp.task('index', ['less', 'cache'], function () {
    var revAll = new RevAll({
        dontRenameFile: [/.html$/]
    });
    var injectSrc = gulp.src([destinationFolder + '/templates.js'], {read: false});
    return gulp
            .src('./index.html')
            .pipe(useref())
            .pipe(inject(injectSrc))
            .pipe(revAll.revision())
            .pipe(gulp.dest(destinationFolder))
    ;
});

// Fix css relative path when server use subfolder
gulp.task('index:fix_path', ['index', 'app'], function () {
    var stream1 = gulp
            .src([
                destinationFolder + '/**/*.*',
                '!' + destinationFolder + '/styles*.css'
            ])
            .pipe(replace('./app/', subFolderPath + 'app/'))
            .pipe(replace('/' + destinationFolder + '/', subFolderPath))
            .pipe(replace('./theme_components/', subFolderPath + 'theme_components/'))
            .pipe(replace('./bower_components/', subFolderPath + 'bower_components/'))
            .pipe(replace('scripts.min', subFolderPath + 'scripts.min'))
            .pipe(replace('styles.min', subFolderPath + 'styles.min'))
            .pipe(gulp.dest(destinationFolder))
    ;
    var stream2 = gulp
            .src(destinationFolder + '/styles*.css')
            .pipe(replace('../../theme_components', './theme_components'))
            .pipe(gulp.dest(destinationFolder))
    ;
    return merge2(stream1, stream2);
});
