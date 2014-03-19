module.exports = {
  task: function() {
     var js_files = require('../files/js_files');
     var js = {};

     for(var f in js_files) {
        if(f[0] !== '_' && f[0] !== 'all') {
          js['<%= assets_dir %>/javascripts/' + f + ".min.js"] = ['<%= assets_dir %>/javascripts/' + f + ".js"];
        }
     }

     return {
        production: {
          options: {
            sourceMap: true,
            //sourceMapName: '<%= assets_dir %>/sourcemap.map',
            banner: '/*! v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
          },
          files: js
        }
      }
  }
}
