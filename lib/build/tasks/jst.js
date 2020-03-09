var jsFiles = require('../files/js_files');

var jsFiles_PATH_REGEX = /^lib\/assets\/javascripts\//;
var jsFiles_EXTENSION_REGEX = /\.jst\.ejs$/;
var MUSTACHE_EXTENSION_REGEX = /\.jst\.mustache/;

exports.task = function () {
  return {
    compile: {
      options: {
        processName: function (filename) {
          return filename
            .replace(jsFiles_PATH_REGEX, '')
            .replace(jsFiles_EXTENSION_REGEX, '');
        }
      },
      files: [
        {
          src: jsFiles._templates,
          dest: '<%= editor_assets_dir %>/javascripts/templates.js'
        }, {
          src: jsFiles._public_map_templates,
          dest: '<%= editor_assets_dir %>/javascripts/public_map_templates.js'
        }, {
          src: jsFiles._public_templates,
          dest: '<%= editor_assets_dir %>/javascripts/public_templates.js'
        }
      ]
    },
    mustache: {
      options: {
        processName: function (filename) {
          return filename
            .replace(jsFiles_PATH_REGEX, '')
            .replace(MUSTACHE_EXTENSION_REGEX, '');
        },
        template: function (source) {
          var src = source.replace(/\n/g, '\\n').replace(/'/g, '\\\'');
          return {
            source: 'cdb.core.Template.compile(\'' + src + '\', \'mustache\')'
          };
        }
      },
      files: [
        {
          '<%= editor_assets_dir %>/javascripts/templates_mustache.js': jsFiles._templates_mustache
        }
      ]
    }
  };
};
