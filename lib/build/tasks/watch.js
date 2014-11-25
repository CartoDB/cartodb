
  /**
   *  Watch/listen for assets
   */

exports.task = function() {
  var js_files = require('../files/js_files');
  var js = [];
  for(var f in js_files) {
    js = js.concat(js_files[f]);
  }

  // watch cdb files
  js.push(['lib/assets/javascripts/cdb/src/**/*.js']);

  // watch browserify modules
  js.push(['lib/assets/javascripts/cartodb/browserify_modules/**/*.js']);

  return {
    js: {
      files: js,
      tasks: ['cdb', 'browserify', 'concat:js', 'jst'],
      options: {
        spawn: false,
        atBegin: true
      }
    },
    css: {
      files: [
        'assets/stylesheets/**/*.css.scss',
        'app/assets/stylesheets/**/*.css.scss'
      ],
      tasks: ['css'],
      options: {
        spawn: false
      }
    },
    livereload: {
      files: [
        'public/assets/<%= pkg.version %>/stylesheets/*.css',
        'public/assets/<%= pkg.version %>/javascripts/*.js'
      ],
      options: {
        livereload: true
      }
    }
  };
};
