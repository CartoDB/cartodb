var path = require('path');

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

  odyssey: {
    src: 'src-browserify/odyssey.js',
    dest: '<%= config.dist %>/cartodb.mod.odyssey.uncompressed.js',
  },
  'odyssey-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/spec/src-browserify/odyssey.spec.js',
    ],
    dest: '<%= config.tmp %>/odyssey-specs.js',
  }
};

module.exports = {
  task: function(grunt) {
    // from https://github.com/substack/browser-pack/blob/aadeabea66feac48193d27d233daf1c85209357e/index.js#L11
    var defaultPreludePath = grunt.file.read(
      path.join('node_modules', 'browserify', 'node_modules', 'browser-pack', '_prelude.js')
    );

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
          debug: true, // to generate source maps
          // Append the default prelude with the header, required for source-maps to match original code
          prelude: [
            "// cartodb.js version: <%= grunt.config.get('bump.version') %>",
            '// uncompressed version: ' + path.basename(bundle.dest),
            "// sha: <%= grunt.config.get('gitinfo').local.branch.current.SHA %>",
            defaultPreludePath
          ].join("\n")
        },
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
