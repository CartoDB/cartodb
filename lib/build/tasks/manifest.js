module.exports = {
  task: function () {
    return {};
  },

  register: function (grunt, ASSETS_DIR) {
    grunt.registerTask('manifest', 'creates rails manifest', function () {
      var assets = grunt.template.process(ASSETS_DIR);
      var version = grunt.template.process('<%= pkg.version %>');
      var s = assets + '/**/*';
      var mapping = grunt.file.expandMapping(s);
      var manifest = assets.replace(version, '') + '/manifest.yml';
      var minify_js = grunt.config.get('env').use_minify;

      grunt.file.write(manifest, '---\n' + mapping.filter(function (s) {
        return !grunt.file.isDir(s.src[0]);
      }).map(function (s) {
        function fixResource (p) {
          return p.replace(assets + '/', '')
            .replace('javascripts/', '')
            .replace('stylesheets/', '')
            .replace('images/', '');
        }

        function fixPath (p) {
          p = p.replace(assets, version);
          if (minify_js) {
            p = p.replace('.js', '.min.js');
          }
          return p;
        }

        return fixResource(s.src[0]) + ': ' + fixPath(s.dest);
      }).join('\n'));
      grunt.log.write(manifest + ' generated');
    });
  }
};
