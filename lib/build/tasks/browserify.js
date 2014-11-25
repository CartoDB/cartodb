// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var remapify = require('remapify');

module.exports = {
  task: function() {
    return {
      options: {
        preBundleCB: function (b) {
          b.plugin(remapify, [
            {
              cwd: './lib/assets/javascripts/cartodb/browserify_modules',
              src: './**/*.js',
              expose: ''
            }
          ]);
        }
      },
      bundle_overrides_table: {
        src: 'lib/assets/javascripts/cartodb/browserify_modules/bundle_overrides/table.js',
        dest: '<%= browserified_modules_dir %>/bundle_overrides/table.js',
        options: {
          transform: ['reactify']
        }
      },
      browserified_modules_tests: {
        src: 'lib/assets/test/spec/cartodb/browserify_modules/**/*.spec.js',
        dest: '.grunt/browserified_modules_tests.js',
        options: {
          transform: ['reactify'],
          browserifyOptions: {
            debug: true
          }
        }
      }
    };
  }
};
