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
          // TODO: this can be achieved prepending the asstes with _
          '!deep-insights/**/*',
          'deep-insights/main.scss',
          'deep-insights/entry.scss',
          '!cartodbjs_v4/**/*',
          'cartodbjs_v4/entry.scss'
        ],
        dest: '<%= assets_dir %>/stylesheets',
        ext: '.css'
      }]
    },
  };
};
