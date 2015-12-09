module.exports = {
  dist: {
    options: {
      sourceMap: false,
      outputStyle: 'compressed'
    },
    files: [{
      expand: true,
      src: [
        'node_modules/perfect-scrollbar/**/*.scss',
        'themes/scss/**/*.scss'
      ],
      dest: '.tmp/scss',
      ext: '.css'
    }]
  }
}
