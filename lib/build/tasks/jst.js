
  /**
   *  JST files generation task
   */

  var js_files = require('../files/js_files');

  exports.task = function() {
    
    return {
      compile: {
        options: {
           processName: function(filename) {
            return filename.replace(/^lib\/assets\/javascripts\//, '').replace(/\.jst\.ejs$/, '');
          }
        },
        files: [
          {
            src: js_files._templates,
            dest: "<%= assets_dir %>/javascripts/templates.js"
          },
          {
            src: js_files._dashboard_templates,
            dest: "<%= assets_dir %>/javascripts/dashboard_templates.js"
          },
          {
            src: js_files._keys_templates,
            dest: "<%= assets_dir %>/javascripts/keys_templates.js"
          },
          {
            src: js_files._account_templates,
            dest: "<%= assets_dir %>/javascripts/account_templates.js"
          },
          {
            src: js_files._organization_templates,
            dest: "<%= assets_dir %>/javascripts/organization_templates.js"
          },
          {
            src: js_files._mobile_apps_templates,
            dest: "<%= assets_dir %>/javascripts/mobile_apps_templates.js"
          },
          {
            src: js_files._confirmation_templates,
            dest: "<%= assets_dir %>/javascripts/confirmation_templates.js"
          }
        ]
      },
      mustache: {
        options: {
           processName: function(filename) {
            return filename.replace(/^lib\/assets\/javascripts\//, '').replace(/\.jst\.mustache/, '');
          },
          template: function(source) {
            var src = source.replace(/\n/g, '\\n').replace(/'/g,"\\'");
            return { source: "cdb.core.Template.compile('" + src + "', 'mustache')" }
          }
        },
        files: [
          { '<%= assets_dir %>/javascripts/templates_mustache.js': js_files._templates_mustache }
        ]
      }
    }
  }
