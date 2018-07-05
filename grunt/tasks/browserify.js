var bundles = require('./_browserify-bundles');

module.exports = {
  task: function () {
    var cfg = {};
    for (var name in bundles) {
      var bundle = bundles[name];
      cfg[name] = {
        src: bundle.src,
        dest: bundle.dest,
        options: {
          watch: '<%= doWatchify %>',
          browserifyOptions: {
            debug: true // to generate source-maps
          }
        }
      };

      var opts = bundle.options;
      if (opts) {
        if (opts.external) cfg[name].options.external = opts.external;
        if (opts.require) cfg[name].options.require = opts.require;
        if (opts.transform) cfg[name].options.transform = opts.transform;

        var bOpts = bundle.options.browserifyOptions;
        if (bOpts) {
          if (bOpts.standalone) cfg[name].options.browserifyOptions.standalone = bOpts.standalone;
        }
      }
    }

    return cfg;
  }
};
