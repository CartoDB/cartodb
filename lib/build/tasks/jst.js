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
          src: jsFiles._keys_templates,
          dest: '<%= editor_assets_dir %>/javascripts/keys_templates.js'
        }, {
          src: jsFiles._public_map_templates,
          dest: '<%= editor_assets_dir %>/javascripts/public_map_templates.js'
        }, {
          src: jsFiles._public_map_templates_static,
          dest: '<%= editor_assets_dir %>/javascripts/public_map_templates_static.js'
        }, {
          src: jsFiles._embed_map_templates_static,
          dest: '<%= editor_assets_dir %>/javascripts/embed_map_templates_static.js'
        }, {
          src: jsFiles._public_templates,
          dest: '<%= editor_assets_dir %>/javascripts/public_templates.js'
        }, {
          src: jsFiles._profile_templates,
          dest: '<%= editor_assets_dir %>/javascripts/profile_templates.js'
        }, {
          src: jsFiles._organization_templates,
          dest: '<%= editor_assets_dir %>/javascripts/organization_templates.js'
        }, {
          src: jsFiles._mobile_apps_templates,
          dest: '<%= editor_assets_dir %>/javascripts/mobile_apps_templates.js'
        }, {
          src: jsFiles._confirmation_templates,
          dest: '<%= editor_assets_dir %>/javascripts/confirmation_templates.js'
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
