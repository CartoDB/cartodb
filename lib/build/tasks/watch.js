/**
 *  Watch/listen for assets
 */

exports.task = function () {
  return {
    css: {
      files: [
        'app/assets/stylesheets/editor-3/**/*.scss',
        'app/assets/stylesheets/deep-insights/**/*.scss',
        'node_modules/cartoassets/src/scss/**/*.scss',
        'node_modules/cartodb.js/themes/scss/**/*.scss'
      ],
      tasks: [
        'copy:css_vendor_cartodb3',
        'copy:css_cartodb3',
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
        'lib/assets/javascripts/cartodb3/**/*',
        'lib/assets/test/spec/cartodb3/**/*',
        'lib/assets/javascripts/deep-insights/**/*',
        'lib/assets/test/spec/deep-insights/**/*',
        'lib/assets/locale/*'
      ],
      tasks: [
        'affected',
        'webpack:builder_specs',
        'jasmine:affected:build'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    dashboard_specs: {
      files: [
        'lib/assets/{core,client}/javascripts/dashboard/**/*',
        'lib/assets/{core,client}/test/spec/dashboard/**/*',
        'lib/assets/{core,client}/locale/*'
      ],
      tasks: [
        'js_dashboard',
        'webpack:builder_specs',
        'jasmine:affected:build'
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
    }
  };
};
