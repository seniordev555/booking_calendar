var gulp = require('gulp');
var less = require('gulp-less');
var cleancss = require('gulp-clean-css');

gulp.task('less', function () {
  return gulp.src('./app/css/style.less')
    .pipe(less({
      paths: [ './app/css' ]
    }))
    .pipe(cleancss())
    .pipe(gulp.dest('./app/css'));
});
