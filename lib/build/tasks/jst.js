
  /**
   *  JST files generation task
   */

  var js_files = require('../files/js_files');
  var Mustache = require('../mustache');

  exports.task = function() {
    
    return {
      compile: {
        options: {
           processName: function(filename) {
            return filename.replace(/^\.\.\/assets\/javascripts\//, '').replace(/\.jst\.ejs$/, '');
          }
        },
        files: {
          "<%= assets_dir %>/javascripts/templates.js": js_files._templates
        }
      },
      mustache: {
        options: {
           processName: function(filename) {
            return filename.replace(/^..\/assets\/javascripts\//, '').replace(/\.jst\.mustache/, '');
          },
          template: function(source) {
            var src = source.replace(/\n/g, '\\n').replace(/'/g,"\\'")
            return { source: "Mustache.compile('"+ src +"')" }
          }
        },
        files: {
          '<%= assets_dir %>/javascripts/templates_mustache.js': js_files._templates_mustache,
        }
      }
    }
  }
