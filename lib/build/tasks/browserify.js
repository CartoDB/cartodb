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
              expose: ''
            }
          ]);
        }
      },
      new_dashboard: {
        src: '<%= browserify_modules.src %>/new_dashboard/entry.js',
        dest: '<%= assets_dir %>/javascripts/new_dashboard.js',
        options: {
          watch: '<%= env.browserify.watch %>',
          browserifyOptions: {
            debug: '<%= env.browserify.debug %>'
          }
        }
      },
      browserify_modules_tests: {
        src: [
          // Add test files that use browserify here:
          'lib/assets/test/spec/cartodb/new_dashboard/**/*.js'
        ],
        dest: '<%= browserify_modules.tests.dest %>',
        options: {
          watch: '<%= env.browserify.watch %>',
          browserifyOptions: {
            debug: '<%= env.browserify.debug %>'
          }
        }
      }
    };
  }
};
