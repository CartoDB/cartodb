// PostCSS task config

exports.task = function() {

  return {
    options: {
      map: true,
      processors: [
        require('autoprefixer-core')({browsers: 'last 1 version'}),
        require('csswring')
      ]
    },
    dist: {
      files: [{
        expand: true,
        cwd: '.tmp/css/',
        src: '{,*/}*.css',
        dest: '.tmp/css/'
      }]
    }
  }

}
