var path = require('path');
var bundles = require('./_browserify-bundles');

module.exports = {
  task: function(grunt) {
    // from https://github.com/substack/browser-pack/blob/aadeabea66feac48193d27d233daf1c85209357e/index.js#L11
    var defaultPrelude = grunt.file.read(
      path.join('node_modules', 'browserify', 'node_modules', 'browser-pack', '_prelude.js')
    );

    var cfg = {};
    for (var name in bundles) {
      var bundle = bundles[name];
      var bCfg = cfg[name] = {
        src: bundle.src,
        dest: bundle.dest,
        options: {
          watch: '<%= config.doWatchify %>',
          browserifyOptions: {
            debug: true, // to generate source-maps
            prelude: [
                // Append the default prelude with the header, required for source-maps to match original code
                "// cartodb.js version: <%= grunt.config.get('bump.version') %>",
                '// uncompressed version: ' + path.basename(bundle.dest),
                "// sha: <%= grunt.config.get('gitinfo').local.branch.current.SHA %>",
                defaultPrelude
              ].join("\n")
          }
        }
      };

      var opts = bundle.options;
      if (opts) {
        cfg[name].options.external = opts.external;
        cfg[name].options.require = opts.require;
      }
    }

    return cfg;
  }
};
