var _ = require('underscore');
var bundles = require('./_browserify-bundles');

module.exports = {
  task: function(grunt) {
    var cfg = {};
    var defaultOptions = {
      sourceMap: true,
      banner: [
        '// CartoDB.js version: <%= grunt.config("bump.version") %>',
        '// sha: <%= grunt.config.get("gitinfo").local.branch.current.SHA %>',
      ].join("\n"),
    };

    for (var bundleName in bundles) {
      if (!/tmp|specs/.test(bundleName)) {
        var files = {};
        var src = bundles[bundleName].dest;
        var uglifiedDest = src.replace('.uncompressed', '');
        files[uglifiedDest] = src;

        cfg[bundleName] = {
          options: _.extend({
            sourceMapIn: src.replace('.js', '.map')
          }, defaultOptions),
          files: files
        }
      }
    }

    return cfg;
  }
}
