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
    js_test_spec_cartodb3: {
      files: [
        'lib/assets/{core,client}/test/spec/cartodb3/**/*'
      ],
      tasks: ['copy:js_test_spec_cartodb3'],
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
        'app/assets/stylesheets/editor-3/**/*.css.scss',
        'app/assets/client/stylesheets/**/*.css.scss'
      ],
      tasks: [
        'copy:app',
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
        'lib/assets/core/javascripts/cartodb3/**/*',
        'lib/assets/client/javascripts/cartodb3/**/*',
        'lib/assets/core/test/spec/cartodb3/**/*',
        'lib/assets/client/test/spec/cartodb3/**/*',
        'lib/assets/core/locale/*',
        'lib/assets/client/locale/*'
      ],
      tasks: [
        'copy_builder',
        'affected',
        'webpack:builder_specs',
        'jasmine:affected:build'
      ],
      options: {
        spawn: false,
        atBegin: false
      }
    }
  };
};
