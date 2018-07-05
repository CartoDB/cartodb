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
        dest: '<%= editor_assets_dir %>/stylesheets',
        ext: '.css'
      }]
    }
  };
};
