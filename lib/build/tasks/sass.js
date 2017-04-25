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
        cwd: 'tmp/sass/builder/',
        src: [
          '**/*.scss'
        ],
        dest: '<%= assets_dir %>/stylesheets',
        ext: '.css'
      }, {
        expand: true,
        cwd: 'tmp/sass/',
        src: [
          '**/*.scss',
          '!builder/**/*',
          '!editor/**/*',
          // TODO: this can be achieved prepending the asstes with _
          '!deep-insights/**/*.scss',
          'deep-insights/main.scss',
          'deep-insights/entry.scss',
          '!cartodbjs_v4/**/*.scss',
          'cartodbjs_v4/entry.scss'
        ],
        dest: '<%= assets_dir %>/stylesheets',
        ext: '.css'
      }]
    },
  };
};
