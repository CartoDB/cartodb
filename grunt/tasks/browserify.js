var bannerStr = function(dest) {
  return [
    "// cartodb.js version: <%= grunt.config.get('bump.version') %>",
    "// uncompressed version: " + dest,
    "// sha: <%= gitinfo.local.branch.current.SHA %>"
  ].join("\n")
};

var bundles = {
  'core': {
    options: {
      banner: bannerStr('cartodb.core.uncompressed.js')
    },
    src: 'src-browserify/core.js',
    dest: '<%= config.dist %>/cartodb.core.uncompressed.js'
  },
  // standard: {
  //   options: {
  //     banner: bannerStr('cartodb.uncompressed.js')
  //   },
  //   src: 'src-browserify/standard.js',
  //   dest: '<%= config.dist %>/cartodb.uncompressed.js'
  // },
  'core-specs': {
    src: [
      'test/spec/src-browserify/core.spec.js',
      'test/spec/src-browserify/api/sql.spec.js',
      'test/spec/src-browserify/core/util.spec.js',
      'test/spec/src-browserify/geo/layer-definition/*.js',
      'test/spec/src-browserify/geo/sublayer.spec.js',
      'test/spec/src-browserify/vis/image.spec.js',
    ],
    dest: '<%= config.tmp %>/core-specs.js'
  },
  'standard-specs': {
    src: [
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
