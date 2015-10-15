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
      styleguide: {
        options: {
          port: 9001,
          open: {
            target: 'http://localhost:9001/themes/styleguide'
          },
          base: [
            '.'
          ]
        }
      }
    }
  }
}
