exports.task = function () {
  return {
    css: {
      files: [
        'app/assets/stylesheets/editor-3/**/*.scss',
        'app/assets/client/stylesheets/**/*.scss',
        'node_modules/cartoassets/src/scss/**/*.scss',
        'node_modules/cartodb-deep-insights.js/themes/scss/**/*.scss',
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
    }
  };
};
