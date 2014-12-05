
/**
 *  Css lint grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        csslintrc: 'grunt/.csslintrc'
      },
      check: {
        src: [
          '<%= config.app %>/css/**/*.css',
          '<%= config.app %>/_scss/**/*.scss'
        ]
      }
    }
  }
}