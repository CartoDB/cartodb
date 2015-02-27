// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var entryBundles = require('../files/browserify_entry_bundles');
var concatBundles = require('../files/browserify_concat_bundles');

module.exports = {
  task: function() {
    var cfg = {};
    [
      entryBundles,
      concatBundles
    ].forEach(function(bundles) {
      for (var name in bundles) {
        var bundle = bundles[name];

        var options = {
          transform: [],

          // enables watchify when grunt is run with a watch task, e.g. `grunt dev`
          // must be evaluated lazily (using template var) to allow override by setConfig task.
          watch:     '<%= env.browserify_watch %>',

          browserifyOptions: {
            // if true will include source maps
            // must be evaluated lazily (using template var) to allow override by setConfig task.
            debug: '<%= env.browserify_debug %>'
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
          dest: bundle.dest || '<%= assets_dir %>/javascripts/' + name +'.js'
        }
      }
    });

    return cfg;
  }
};
