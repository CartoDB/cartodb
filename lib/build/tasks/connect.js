// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var entryBundles = require('../files/browserify_entry_bundles');
var concatBundles = require('../files/browserify_concat_bundles');

module.exports = {
  task: function() {
    return {
      jasmine: {
        options: {
          port: 8089,
          livereload: true,
          base: {
            path: '.',
            options: {
              index: '_SpecRunner.html'
            }
          }
        }
      }
    };
  }
};
