
  /**
   *  Watch/listen for assets
   */

exports.task = function() {
  var js_files = require('../files/js_files');
  var js = [];
  for(var f in js_files) {
    js = js.concat(js_files[f]);
  }


  return {
    js: {
      files: js,
      tasks: ['concat:js'],
      options: {
        spawn: false,
      },
    },
    css: {
      files: [
        '../../vendor/assets/stylesheets/**/*.scss',
        '../../app/assets/stylesheets/**/*.scss'
      ],
      tasks: ['css'],
      options: {
        spawn: true,
      },
    }
  };
      /*
      css: {
        files: ['../../app/assets/stylesheets/*.scss'],
        tasks: ['compass']
      }
      */
};
