
/**
 *  SVG grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.dist %>/<%= config.app %>',
          src: '**/*.svg',
          dest: '<%= config.dist %>/<%= config.app %>'
        }]
      }
    }
  }
}