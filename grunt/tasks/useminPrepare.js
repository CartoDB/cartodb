
/**
 *  User min prepare grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        dest: '<%= config.dist %>/<%= config.app %>'
      },
      html: [
        '<%= config.dist %>/<%= config.app %>/**/*.html',
      ]
    }
  }
}