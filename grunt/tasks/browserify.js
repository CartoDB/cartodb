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
      'test/spec/src-browserify/api/**/*',
      'test/spec/src-browserify/core/**/*',
      'test/spec/src-browserify/geo/**/*',
      'test/spec/src-browserify/ui/**/*',
      'test/spec/src-browserify/vis/**/*',

      // not actually used anywhere in cartodb.js, only for editor?
      // TODO can be (re)moved?
      '!test/spec/src-browserify/ui/common/tabpane.spec.js',
    ],
    dest: '<%= config.tmp %>/src-browserify-specs.js'
  },

  cartodb: {
    options: {
      banner: bannerStr('cartodb.uncompressed.js')
    },
    src: 'src-browserify/cartodb.js',
    dest: '<%= config.dist %>/cartodb.uncompressed.js'
  },
  'cartodb-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/spec/src-browserify/cartodb.spec.js',
    ],
    dest: '<%= config.tmp %>/cartodb-specs.js'
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
