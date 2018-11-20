/**
 *  Clean task config
 */

exports.task = function () {
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
      '<%= editor_assets_dir %>'
    ]
  };
};
