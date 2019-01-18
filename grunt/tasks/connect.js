/**
 *  Connect grunt task for CARTO.js website
 *
 */
module.exports = {
  task: function() {
    return {
      server: {
        options: {
          port: 9001,
          livereload: 35730,
          open: true,
          hostname: '0.0.0.0', // to be able to access the server not only from localhost
          base: {
            path: '.'
          }
        }
      }
    }
  }
}
