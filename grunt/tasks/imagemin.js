
/**
 *  Image minifier grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      dist: {
        options: {
          progressive: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.dist %>',
          src: ['*.{png,jpg,gif}'],
          dest: '<%= config.dist %>'
        }]
      }
    }
  }
}