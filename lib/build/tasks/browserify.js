// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var remapify = require('remapify');

module.exports = {
  task: function() {
    return {
      options: {
        preBundleCB: function (b) {
          b.plugin(remapify, [
            {
              cwd: './lib/assets/javascripts/cartodb',
              src: './**/*.js',
              expose: 'cartodb'
            }, {
              cwd: './lib/assets/javascripts/cartodb2',
              src: './**/*.js',
              expose: ''
            }
          ]);
        }
      },
      cartodb2: {
        src: 'lib/assets/javascripts/cartodb2/dashboard.js',
        dest: '<%= assets_dir %>/javascripts/new-dashboard.js'
      },
      cartodb2_tests: {
        src: 'lib/assets/test/spec/cartodb2/**/*.spec.js',
        dest: 'lib/assets/test/cartodb2_tests.js',
        options: {
          browserifyOptions: {
            debug: true
          }
        }
      }
    };
  }
};
