
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

  return {
    js: {
      files: js,
      tasks: ['cdb', 'concat:js', 'jst'],
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
        spawn: false,
        atBegin: false
      }
    },
    livereload: {
      files: [
        'public/assets/<%= pkg.version %>/stylesheets/*.css',
        'public/assets/<%= pkg.version %>/javascripts/*.js',
        '<%= browserify_modules.tests.dest %>' // makes jasmine-server to rerun tests on test files' changes too
      ],
      options: {
        livereload: true
      }
    }
  };
};
