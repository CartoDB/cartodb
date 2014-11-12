
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
        '<%= config.app %>/js/**/*.js',
        'test/spec/**/*.js'
      ]
    }
  }
}

    