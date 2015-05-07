var gulp = require('gulp');
var iconfont = require('gulp-iconfont');
var iconfontCss = require('gulp-iconfont-css');


gulp.task('default', function(){
  gulp.src(['./app/assets/fonts/icon_font/svgs/*.svg'])
    
    .pipe(iconfontCss({
      fontName: 'cartoIcon',
      path: './app/assets/fonts/icon_font/templates/_icons.scss',
      targetPath: '../stylesheets/common/icon-font.css.scss',
      fontPath: '../../fonts/'
    }))

    .pipe(iconfont({
      fontName: 'cartoIcon', // required
      appendCodepoints: true // recommended option
    }))

    .pipe(gulp.dest('app/assets/fonts/'));
});
