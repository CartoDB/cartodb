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

      // Required for source-map-support install to work in a non-headless browserify
      // Use this instead of opening test/SpecRunner-*.html files directly
      jasmine: {
        options: {
          port: 8091,
          livereload: true,
          base: {
            path: '.',
            options: {
              index: 'test/SpecRunner-core.html'
            }
          }
        }
      },

      // TODO remove? used to test examples
      examples: {
        options: {
          port: 8092,
          livereload: true,
          open: {
            target: 'http://localhost:8092/examples/index.html'
          },
          base: {
            path: '.',
            options: {
              index: './examples/index.html'
            }
          }
        }
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
