var bannerStr = function(dest) {
  return [
    "// cartodb.js version: <%= grunt.config.get('bump.version') %>",
    "// uncompressed version: " + dest,
    "// sha: <%= gitinfo.local.branch.current.SHA %>"
  ].join("\n")
};

var bundles = {

  // Specs that are shared for all bundles
  // Ordered by dirs before files, and after that alpabetically
  'src-browserify-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/lib/reset-proxies-after-each.js',
      'test/spec/src-browserify/require-proxies/create-require-proxy.spec.js',
      'test/spec/src-browserify/api/sql.spec.js',
      'test/spec/src-browserify/core/log/*.js',
      'test/spec/src-browserify/core/decorators.spec.js',
      'test/spec/src-browserify/core/log.spec.js',
      'test/spec/src-browserify/core/model.spec.js',
      'test/spec/src-browserify/core/sanitize.spec.js',
      'test/spec/src-browserify/core/template-list.spec.js',
      'test/spec/src-browserify/core/template.spec.js',
      'test/spec/src-browserify/core/util.spec.js',
      'test/spec/src-browserify/core/view.spec.js',
      'test/spec/src-browserify/geo/geocoder/*.js',
      'test/spec/src-browserify/geo/layer-definition/*.js',
      'test/spec/src-browserify/geo/leaflet/*.js',
      'test/spec/src-browserify/geo/map/*.js',
      'test/spec/src-browserify/geo/ui/infowindow.spec.js',
      'test/spec/src-browserify/geo/ui/infowindow-model.spec.js',
      'test/spec/src-browserify/geo/ui/legend.spec.js',
      'test/spec/src-browserify/geo/cartodb-layer-common.spec.js',
      'test/spec/src-browserify/geo/geometry.spec.js',
      'test/spec/src-browserify/geo/map-view.spec.js',
      'test/spec/src-browserify/geo/map.spec.js',
      'test/spec/src-browserify/geo/search.spec.js',
      'test/spec/src-browserify/geo/sublayer.spec.js',
      'test/spec/src-browserify/vis/image.spec.js',
    ],
    dest: '<%= config.tmp %>/src-browserify-specs.js'
  },

  'core': {
    options: {
      banner: bannerStr('cartodb.core.uncompressed.js')
    },
    src: 'src-browserify/core.js',
    dest: '<%= config.dist %>/cartodb.core.uncompressed.js'
  },
  'core-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/spec/src-browserify/core.spec.js',
      'test/spec/src-browserify/api/tiles.spec.js',
    ],
    dest: '<%= config.tmp %>/core-specs.js'
  },

  standard: {
    options: {
      banner: bannerStr('cartodb.uncompressed.js')
    },
    src: 'src-browserify/standard.js',
    dest: '<%= config.dist %>/cartodb.uncompressed.js'
  },
  'standard-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/spec/src-browserify/standard.spec.js',
    ],
    dest: '<%= config.tmp %>/standard-specs.js'
  },
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
