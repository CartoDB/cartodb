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
      'lib/assets/javascripts/cartodb3',
      'lib/assets/test/spec/cartodb3',
      'lib/assets/locale',
      '<%= assets_dir %>'
    ]
  }
}
