module.exports = {
  task: function () {
    return {
      server: {
        options: {
          port: 8089,
          livereload: false,
          open: 'http://localhost:8089/editor_specs.html',
          hostname: '0.0.0.0', // to be able to access the server not only from localhost
          base: {
            path: '.'
          }
        }
      },
      // For Headless chrome tests (grunt test)
      test: {
        options: {
          port: 8088,
          livereload: false,
          hostname: '0.0.0.0', // to be able to access the server not only from localhost
          base: {
            path: '.'
          }
        }
      },
      // Watching the specs during development
      specs: {
        options: {
          port: 8088,
          livereload: false,
          open: 'http://localhost:8088/builder_specs.html',
          hostname: '0.0.0.0', // to be able to access the server not only from localhost
          base: {
            path: '.'
          }
        }
      }
    };
  }
};
