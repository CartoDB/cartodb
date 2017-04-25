/**
 *  Clean task config
 */

exports.task = function() {
  return {
    options: {
      force: true
    },
    dist: [
      '.grunt',
      '.sass-cache',
      'tmp/sass',
      'lib/build/app_config.js',
      '<%= assets_dir %>',
      'lib/assets/javascripts/cartodb3',
      'lib/assets/test/{spec,jasmine}/cartodb3',
      'lib/assets/locale'
    ]
  }
}
