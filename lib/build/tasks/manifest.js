
module.exports = {

  task: function() {
    return {}
  },

  register: function(grunt, ASSETS_DIR) {
    grunt.registerTask('manifest', 'creates rails manifest', function() {
      var assets = grunt.template.process(ASSETS_DIR);
      var version = grunt.template.process('<%= pkg.version %>');
      var s = assets + "/**/*";
      var mapping = grunt.file.expandMapping(s);
      var manifest = assets.replace(version, '') + "/manifest.yml"
      grunt.file.write(manifest, "---\n" + mapping.filter(function(s) {
        return !grunt.file.isDir(s.src[0]);
      }).map(function(s) {
        function fixPath(p) { 
          return p.replace(assets + '/', '')
            .replace('javascripts/', '')
            .replace('stylesheets/', '')
            .replace('images/', '')
        }
        return fixPath(s.src[0]) + ": " + s.dest.replace(assets, version)
      }).join('\n'));
      grunt.log.write(manifest  + " generated");
    })
  }
}
