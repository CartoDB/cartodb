/**
 *  Watch/listen for assets
 */

exports.task = function () {
  return {
    js_cartodb: {
      files: [
        'lib/assets/core/javascripts/cartodb/organization/**/*'
      ],
      tasks: ['copy:js_cartodb', 'jst'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_cartodb3: {
      files: [
        'lib/assets/{core,client}/javascripts/cartodb3/**/*'
      ],
      tasks: ['copy:js_cartodb3'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_test_cartodb3: {
      files: [
        'lib/assets/{core,client}/test/spec/cartodb3/**/*'
      ],
      tasks: ['copy:js_test_cartodb3'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_deep_insights: {
      files: [
        'lib/assets/{core,client}/javascripts/deep-insights/**/*'
      ],
      tasks: ['copy:js_deep_insights'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_test_deep_insights: {
      files: [
        'lib/assets/{core,client}/test/spec/deep-insights/**/*'
      ],
      tasks: ['copy:js_test_deep_insights'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    locale: {
      files: [
        'lib/assets/{core,client}/locale/**/*'
      ],
      tasks: ['copy:locale'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    css: {
      files: [
        'app/assets/stylesheets/editor-3/**/*.scss',
        'app/assets/client/stylesheets/**/*.scss',
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
        'lib/assets/{core,client}/javascripts/cartodb3/**/*',
        'lib/assets/{core,client}/test/spec/cartodb3/**/*',
        'lib/assets/{core,client}/javascripts/deep-insights/**/*',
        'lib/assets/{core,client}/test/spec/deep-insights/**/*',
        'lib/assets/{core,client}/locale/*'
      ],
      tasks: [
        'js_builder',
        'affected',
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
        '!lib/assets/core/javascripts/cartodb/organization/**/*',
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
