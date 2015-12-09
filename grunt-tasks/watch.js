module.exports = {
  scss: {
    files: ['themes/scss/**/*.scss'],
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
