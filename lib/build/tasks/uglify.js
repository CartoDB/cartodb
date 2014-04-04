module.exports = {
  task: function() {
     var js_files = require('../files/js_files');
     var js = {};

    var files = Object.keys(js_files).concat(['templates', 'templates_mustache'])
     for(var i in files) {
       var f = files[i];

        if(f[0] !== '_' && f !== 'all') {
          js['<%= assets_dir %>/javascripts/' + f + ".js"] = ['<%= assets_dir %>/javascripts/' + f + ".uncompressed.js"];
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
