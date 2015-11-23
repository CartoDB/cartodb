var gulp = require('gulp');
var iconfont = require('gulp-iconfont');
var iconfontCss = require('gulp-iconfont-css');


gulp.task('default', function(){
  gulp.src(['./themes/svg/*.svg'])

    .pipe(iconfontCss({
      fontName: 'CDBIcon',
      path: './themes/svg/_icons.scss',
      targetPath: '../scss/icons/icons.scss',
      fontPath: '../../fonts/'
    }))

    .pipe(iconfont({
      fontName: 'CDBIcon', // required
      appendCodepoints: true // recommended option
    }))

    .pipe(gulp.dest('themes/fonts/'));
});
