/**
 *  Watch/listen for assets
 */

exports.task = function () {
  return {
    css: {
      files: [
        'app/assets/stylesheets/editor-3/**/*.scss',
        'app/assets/stylesheets/deep-insights/**/*.scss',
        'app/assets/stylesheets/new_dashboard/**/*.scss',
        'app/assets/stylesheets/tilesets_viewer/**/*.scss',
        'node_modules/cartoassets/src/scss/**/*.scss',
        'node_modules/internal-carto.js/themes/scss/**/*.scss'
      ],
      tasks: [
        'copy:css_vendor_builder',
        'copy:css_builder',
        'copy:css_dashboard',
        'sass',
        'concat:css'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_affected: {
      files: [
        'lib/assets/javascripts/builder/**/*',
        'lib/assets/test/spec/builder/**/*',
        'lib/assets/javascripts/deep-insights/**/*',
        'lib/assets/test/spec/deep-insights/**/*',
        'lib/assets/javascripts/locale/*'
      ],
      tasks: [
        'generate_builder_specs',
        'webpack:builder_specs',
        'jasmine:builder:build'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    dashboard_specs: {
      files: [
        'lib/assets/javascripts/dashboard/**/*',
        'lib/assets/test/spec/dashboard/**/*',
        'lib/assets/javascripts/locale/*',
        'lib/assets/test/spec/fixtures/**/*'
      ],
      tasks: [
        'generate_dashboard_specs',
        'webpack:dashboard_specs',
        'jasmine:dashboard:build'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_affected_editor: {
      files: [
        'lib/assets/javascripts/cartodb/**/*',
        'lib/assets/test/spec/cartodb/**/*'
      ],
      tasks: [
        'concat:js',
        'jst',
        'jasmine:cartodbui:build'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    cdb: {
      files: [
        'lib/assets/javascripts/cdb/**/*'
      ],
      tasks: [
        'cdb',
        'dev-editor'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    }
  };
};
