
  /**
   *  Watch/listen for assets
   */

exports.task = function () {
  return {
    js_core_cartodb: {
      files: [
        'lib/assets/core/javascripts/cartodb/organization/**/*'
      ],
      tasks: ['copy:js_core_cartodb', 'copy:js_client_cartodb', 'jst'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_client_cartodb: {
      files: [
        'lib/assets/client/javascripts/cartodb/organization/**/*'
      ],
      tasks: ['copy:js_client_cartodb', 'jst'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_core_cartodb3: {
      files: [
        'lib/assets/core/javascripts/cartodb3/**/*'
      ],
      tasks: ['copy:js_core_cartodb3', 'copy:js_client_cartodb3'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_client_cartodb3: {
      files: [
        'lib/assets/client/javascripts/cartodb3/**/*'
      ],
      tasks: ['copy:js_client_cartodb3'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_test_spec_core_cartodb3: {
      files: [
        'lib/assets/core/test/spec/cartodb3/**/*'
      ],
      tasks: ['copy:js_test_spec_core_cartodb3', 'copy:js_test_spec_client'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_test_spec_client_cartodb3: {
      files: [
        'lib/assets/client/test/spec/cartodb3/**/*'
      ],
      tasks: ['copy:js_test_spec_client_cartodb3'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_test_jasmine_core_cartodb3: {
      files: [
        'lib/assets/core/test/jasmine/cartodb3/**/*'
      ],
      tasks: ['copy:js_test_jasmine_core_cartodb3', 'copy:js_test_jasmine_client'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    js_test_jasmine_client_cartodb3: {
      files: [
        'lib/assets/client/test/jasmine/cartodb3/**/*'
      ],
      tasks: ['copy:js_test_jasmine_client_cartodb3'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    locale_core: {
      files: [
        'lib/assets/core/locale/**/*'
      ],
      tasks: ['copy:locale_core', 'copy:locale_client'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    locale_client: {
      files: [
        'lib/assets/client/locale/**/*'
      ],
      tasks: ['copy:locale_client'],
      options: {
        spawn: false,
        atBegin: false
      }
    },
    css: {
      files: [
        // cartodb
        'app/assets/stylesheets/organization/**/*.css.scss',
        // cartodb3
        'app/assets/stylesheets/editor-3/**/*.css.scss',
        'app/assets/client/stylesheets/**/*.css.scss'
      ],
      tasks: ['css'],
      options: {
        spawn: false,
        atBegin: false
      }
    }
  };
};
