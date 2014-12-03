// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var remapify = require('remapify');
var entryBundles = require('../files/browserify_entry_bundles');
var concatBundles = require('../files/browserify_concat_bundles');

module.exports = {
  task: function() {
    var cfg = {
      options: {
        preBundleCB: function(b) {
          // Enables non-relative require calls, e.g. `require('new_dashboard/common/whatever.js')` from any file.
          b.plugin(remapify, [
            {
              cwd: './lib/assets/javascripts/cartodb',
              src: './**/*.js',
              expose: ''
            }
          ]);
        }
      }
    };

    [
      entryBundles,
      concatBundles,
    ].forEach(function(bundles) {
      for (var name in bundles) {
        var bundle = bundles[name];
        cfg[name] = {
          src: bundle.src,

          // By default will output bundles to public assets dir
          dest: bundle.dest || '<%= assets_dir %>/javascripts/'+ name +'.js',

          options: {
            // enables watchify when grunt is run with a watch task, e.g. `grunt browserify watch:js`
            watch: '<%= env.browserify.watch %>',

            browserifyOptions: {
              // if true will include source maps
              debug: '<%= env.browserify.debug %>'
            }
          }
        }
      }
    });

    return cfg;
  }
};
