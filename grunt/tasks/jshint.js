/**
 *  JS hint grunt task for CartoDB.js
 *
 */
module.exports = {
  task: function() {
    return {
      options: {
        jshintrc: 'grunt/.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        'test/spec/**/*.js'
      ]
    }
  }
}
