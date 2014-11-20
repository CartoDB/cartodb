
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
  js.push(['../assets/javascripts/cdb/src/**/*.js']);

  return {
    js: {
      files: js,
      tasks: ['cdb', 'concat:js', 'jst'],
      options: {
        spawn: false
      }
    },
    css: {
      files: [
        '../../vendor/assets/stylesheets/**/*.css.scss',
        '../../app/assets/stylesheets/**/*.css.scss'
      ],
      tasks: ['css'],
      options: {
        spawn: false
      }
    },
    livereload: {
      files: [
        '../../public/assets/<%= pkg.version %>/stylesheets/*.css',
        '../../public/assets/<%= pkg.version %>/javascripts/*.js'
      ],
      options: {
        livereload: true
      }
    },
    new_dashboard: {
      files: [
        'src/**/*.js',
        'test/**/*.js'
      ],
      tasks: ['browserify', 'jasmine:new_dashboard'],
      options: {
        atBegin: true,
        reload: true
      }
    }
  };
};
