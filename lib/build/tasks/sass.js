/**
 *  Compass task config
 */

exports.task = function () {
  return {
    options: {
      sourceMap: false,
      sourceMapEmbed: false,
      sourceMapContents: false,
      includePaths: [
        'node_modules/cartoassets/src/scss'
      ]
    },
    dist: {
      files: [{
        expand: true,
        cwd: 'tmp/sass/',
        src: [
          '**/*.scss',
          '!editor/**/*'
        ],
        dest: '<%= assets_dir %>/stylesheets',
        ext: '.css'
      }]
    }
  };
};
