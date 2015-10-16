var fs = require('fs');

var bundles = {
  'core': {
    options: {
      banner: fs.readFileSync('./grunt/templates/version_header.js', { encoding: 'utf8' }),
      // TODO: appending footer at his stage screws up up the source-map,
      //   since the source-map no longers matches content; could this be solved differently?
      // postBundleCB: function(err, src, next) {
      //   next(err,
      //     Buffer.concat([src, new Buffer('//cartodb.core end', 'utf8')])
      //   );
      // }
    },
    src: [
      'src-browserify/core.js'

    // migrate to require style
      // 'src/vis/image.js',
      // 'src/api/tiles.js'
    ],
    dest: '<%= config.dist %>/cartodb.core.uncompressed.js'
  },
  'core-specs': {
    src: [
      'test/spec/src-browserify/**/*.spec.js'
    ],
    dest: '<%= config.tmp %>/core-specs.js'
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
