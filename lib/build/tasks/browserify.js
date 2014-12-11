// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var remapify = require('remapify');
var entryBundles = require('../files/browserify_entry_bundles');
var concatBundles = require('../files/browserify_concat_bundles');

module.exports = {
  task: function(browserifyWatch, browserifyDebug, assetsDir) {
    if (browserifyWatch === undefined) throw new TypeError('browserifyWatch is required, expected a value of true|false');
    if (browserifyDebug === undefined) throw new TypeError('browserifyDebug is required, expected a value of true|false');
    if (typeof assetsDir !== 'string' || assetsDir.length === 0) throw new TypeError('assetsdir is required, expected a non-empty string');

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

        var options = {
          transform: [],

          // enables watchify when grunt is run with a watch task, e.g. `grunt browserify watch:js`
          watch: browserifyWatch,

          browserifyOptions: {
            // if true will include source maps
            debug: browserifyDebug
          }
        };

        if (bundle.options) {
          if (bundle.options.transform) {
            options.transform = options.transform.concat(bundle.options.transform);
          }
        }

        cfg[name] = {
          options: options,
          src: bundle.src,
          dest: bundle.dest || assetsDir +'/javascripts/' + name +'.js'
        }
      }
    });

    return cfg;
  }
};
