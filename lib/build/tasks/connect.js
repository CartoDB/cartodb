const DEFAULT_CONFIG = {
  livereload: false,
  hostname: '0.0.0.0', // to be able to access the server not only from localhost
  base: {
    path: '.'
  }
};

function generateConfig (cfg) {
  return Object.assign({}, DEFAULT_CONFIG, cfg);
}

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
      specs_dashboard: {
        options: generateConfig({
          port: 8090,
          open: 'http://localhost:8090/_SpecRunner_dashboard.html'
        })
      },

      specs_builder: {
        options: generateConfig({
          port: 8088,
          open: 'http://localhost:8088/_SpecRunner_builder.html'
        })
      }
    };
  }
};
