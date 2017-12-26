module.exports = {
  scss: {
    files: [
      'node_modules/cartodb.js/themes/scss/**/*.scss',
      'themes/scss/**/*.scss'
    ],
    tasks: [
      'sass',
      'concat:themes',
      'cssmin:themes'
    ],
    options: {
      spawn: false,
      livereload: 35732
    }
  }
}
