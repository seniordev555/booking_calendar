var gulp = require('gulp');
var ga = require('gulp-ga');

var config = require('../gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;

// If on config file, there is googleAnalyticsTrackingId field
// Google Analytics scripts will be added
gulp.task('ga', function(){
    if (config.googleAnalyticsTrackingId) {
        return gulp
                .src(destinationFolder + '/index.html')
                .pipe(ga({url: 'auto', uid: config.googleAnalyticsTrackingId, sendPageView: true, tag: 'body'}))
                .pipe(gulp.dest(destinationFolder))
        ;
    }
});
