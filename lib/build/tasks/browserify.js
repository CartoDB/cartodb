// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var remapify = require('remapify');

module.exports = {
  task: function(grunt, config) {
    return {
      options: {
        preBundleCB: function (b) {
          b.plugin(remapify, [
            {
              cwd: './src',
              src: './**/*.js',
              expose: ''
            }
          ]);
        }
      },
      dashboard: {
        src: 'src/dashboard.js',
        dest: '<%= assets_dir %>/javascripts/new-dashboard.js'
      }
    };
  }
};
