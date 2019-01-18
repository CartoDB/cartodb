
/**
 *  Connect grunt task for CartoDB.js website
 *
 */

module.exports = {
  task: function(config) {
    return {
      options: {
        port: 9001,
        livereload: 35730,
        // change this to '0.0.0.0' to access the server from outside
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          middleware: function(connect) {
            return [
              connect.static('.tmp'),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect.static(config.app)
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: [
            '<%= config.dist %>/<%= config.app %>'
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