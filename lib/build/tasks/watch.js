
  /**
   *  Watch/listen for assets
   */

exports.task = function () {
  return {
    js_core_cartodb3: {
      files: [
        'lib/assets/core/javascripts/cartodb3/**/*'
      ],
      tasks: ['copy:js_core_cartodb3', 'copy:js_client'],
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
