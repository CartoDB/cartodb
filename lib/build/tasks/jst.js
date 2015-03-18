
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
            src: js_files._new_dashboard_templates,
            dest: "<%= assets_dir %>/javascripts/new_dashboard_templates.js"
          },
          {
            src: js_files._new_keys_templates,
            dest: "<%= assets_dir %>/javascripts/new_keys_templates.js"
          },
          {
            src: js_files._account_templates,
            dest: "<%= assets_dir %>/javascripts/account_templates.js"
          },
          {
            src: js_files._new_organization_templates,
            dest: "<%= assets_dir %>/javascripts/new_organization_templates.js"
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
