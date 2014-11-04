
/**
 *  Connect grunt task for CartoDB.js website
 *
 */

module.exports = {
  task: function() {
    return {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          open: true,
          base: [
            '.tmp',
            '<%= config.app %>'
          ]
        }
      },
      dist: {
        options: {
          open: true,
          base: [
            '<%= config.dist %>'
          ]
        }
      },
      test: {
        options: {
          base: [
            '.tmp',
            'test',
            '<%= config.app %>'
          ]
        }
      }
    }
  }
}