
  /**
   *  Concat assets generation task
   */

  exports.task = function(target_dir) {

    var js_files = require('../files/js_files');
    var css_files = require('../files/css_files');

    var concat = {
      js: { files: {} },
      css: { files: {} }
    }

    for(var f in js_files) {
      if(f[0] !== '_') {
        concat.js.files['<%= assets_dir %>/javascripts/' + f + ".js"] = js_files[f]
      }
    }

    for(var f in css_files) {
      if(f[0] !== '_') {
        concat.css.files['<%= assets_dir %>/stylesheets/' + f + ".css"] = css_files[f];
      }
    }

    return concat;
  }
