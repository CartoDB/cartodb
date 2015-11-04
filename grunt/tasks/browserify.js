var path = require('path');
var bundles = require('./_browserify-bundles');

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
