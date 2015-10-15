var fs = require('fs');

var bundles = {
  'core': {
    options: {
      banner: fs.readFileSync('./grunt/templates/version_header.js', { encoding: 'utf8' }),
      postBundleCB: function(err, src, next) {
        next(err,
          Buffer.concat([src, new Buffer('//cartodb.core end', 'utf8')])
        );
      }
    },
    src: [
      'src-browserify/core.js'
    // require(…)
      // 'vendor/underscore.js',
      // 'grunt/templates/underscore_no_conflict.js',
      // 'vendor/mustache.js',

    // browserify-shim
      // 'vendor/reqwest.min.js',

    // migrate to require style
      // 'src/core/util.js',
      // 'src/api/sql.js',
      // 'src/geo/layer_definition.js',
      // 'src/geo/sublayer.js',
      // 'src/core/loader.js',
      // 'src/vis/image.js',
      // 'src/api/tiles.js'
    ],
    dest: '<%= config.dist %>/cartodb.core.uncompressed.js'
  }
};

module.exports = {
  task: function() {
    var cfg = {};
    for (var name in bundles) {
      var bundle = cfg[name] = bundles[name];
      if (!bundle.options) {
        bundle.options = {}
      }

      var defaultOptions = {
        transform: [],
        watch: '<%= config.doWatchify %>',
        browserifyOptions: {
          debug: true // to generate source maps
        }
      };
      for (var key in defaultOptions) {
        var value = defaultOptions[key];
        if (!bundle.options[key]) {
          bundle.options[key] = value;
        }
      }
    }

    return cfg;
  }
};
