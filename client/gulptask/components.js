var gulp = require('gulp');

var config = require('../gulp-config.json');
var subFolderPath = config.subFolderPath;
var destinationFolder = config.destinationFolder;

// Copy theme's components
// These files are theme's components, which would be use by router's oclazyload
// That's why we still have to keep them
gulp.task('components', function () {
    return gulp
            .src('./theme_components/assets/global/**/*.*', {base: './'})
            .pipe(gulp.dest(destinationFolder))
    ;
});
