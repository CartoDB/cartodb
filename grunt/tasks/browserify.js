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
      'test/spec/src-browserify/core/**/*',
      'test/spec/src-browserify/geo/**/*',
      'test/spec/src-browserify/ui/**/*',
      '!test/spec/src-browserify/ui/common/tabpane.spec.js',
      'test/spec/src-browserify/vis/**/*',
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
