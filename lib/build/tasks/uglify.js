var jsBundles = require('../files/js_files');
var browserifyBundles = require('../files/browserify_files');

module.exports = {
  task: function() {
    var js = {};

    // Files to be uglified that are created outside of this process
    var files = Object.keys(browserifyBundles).concat(['templates', 'templates_mustache']);
    for(var i in files) {
     var f = files[i];
      if(f[0] !== '_' && f !== 'all') {
        js['<%= assets_dir %>/javascripts/' + f + '.js'] = ['<%= assets_dir %>/javascripts/' + f + '.uncompressed.js'];
      }
    }

    // Bundle definitions, concat'ed and uglified in one go
    for (var bundleName in jsBundles) {
      var src = jsBundles[bundleName];
      if (bundleName[0] !== '_' && bundleName !== 'all') {
        js['<%= assets_dir %>/javascripts/' + bundleName + '.js'] = src;
      }
    }

    return {
      production: {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true,
          banner: '/*! v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
        },
        files: js
      }
    };
  }
};
