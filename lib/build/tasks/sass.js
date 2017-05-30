/**
 *  Compass task config
 */

exports.task = function () {
  return {
    options: {
      sourceMap: true,
      sourceMapEmbed: true,
      sourceMapContents: true,
      includePaths: [
        'tmp/sass/cartoassets/'
      ]
    },
    dist: {
      files: [{
        expand: true,
        cwd: 'tmp/sass/',
        src: [
          '**/*.scss',
          '!editor/**/*',
          'deep-insights/entry.scss',
          'cartodbjs_v4/entry.scss'
        ],
        dest: '<%= assets_dir %>/stylesheets',
        ext: '.css'
      }]
    }
  };
};
